import { ConflictError } from '../shared/errors';
import type { VolunteerStatus, Weekday } from '../volunteers/Volunteer';
import { haversineKm, type Coordinates } from './geo';
import { estimatedRouteKm, type Stop } from './route';

/**
 * Topes que protegen las horas de servicio del voluntario. Vienen de la configuración
 * (`env.ts`) y no están escritos aquí porque BAMX los va a querer ajustar sin tocar código.
 */
export type AssignmentLimits = {
  maxPickupsPerDay: number;
  maxRouteKm: number;
  maxPickupsPerMonth: number;
};

// La solicitud de donación que hay que asignar, con lo que la decisión necesita saber de ella.
export type RequestToAssign = {
  id: string;
  donorId: string;
  municipalityId: number;
  coordinates: Coordinates;
  preferredDate: string; // 'YYYY-MM-DD'
  preferredTimeFrom: string; // 'HH:MM:SS'
  preferredTimeTo: string;
  preferredCampaignId: string | null;
};

// Un voluntario que podría tomarla, con su carga actual ya resuelta por el repositorio.
export type VolunteerCandidate = {
  id: string;
  userId: string;
  // Para decirle al donador quién va a pasar por su donativo.
  name: string;
  status: VolunteerStatus;
  municipalityIds: number[];
  availableDays: Weekday[];
  availableFrom: string; // 'HH:MM:SS'
  availableTo: string;
  // Paradas que ya tiene ese mismo día y recolecciones del mes, para los topes y el desempate.
  stopsOnDate: Stop[];
  pickupsInMonth: number;
};

export type DestinationCampaign = { id: string; name: string; coordinates: Coordinates };

export type AssignmentContext = {
  request: RequestToAssign;
  destination: DestinationCampaign;
  limits: AssignmentLimits;
  // Voluntarios a los que ya no se les vuelve a ofrecer: rechazaron esta solicitud, la
  // cancelaron o dejaron vencer la propuesta.
  excludedVolunteerIds: string[];
};

// 'YYYY-MM-DD' es una fecha sin hora, así que se lee en UTC para que la zona del servidor no
// corra el día. getUTCDay() devuelve 0 en domingo.
const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function weekdayOf(date: string): Weekday {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

// La base guarda 'HH:MM:SS'; un 'HH:MM' suelto se completa para que la comparación de texto
// siga funcionando ('09:00' sería menor que '09:00:00' y el traslape saldría mal).
const time = (value: string) => (value.length === 5 ? `${value}:00` : value);

// Dos ventanas se traslapan si cada una empieza antes de que termine la otra. Basta un minuto
// en común: el voluntario y el donador ya se ponen de acuerdo por teléfono.
export const overlaps = (aFrom: string, aTo: string, bFrom: string, bTo: string) =>
  time(aFrom) < time(bTo) && time(bFrom) < time(aTo);

// La parada que se le agregaría al voluntario si tomara esta solicitud.
const stopFor = ({ request, destination }: AssignmentContext): Stop => ({
  id: request.id,
  coordinates: request.coordinates,
  destination: destination.coordinates,
  timeFrom: request.preferredTimeFrom,
});

/**
 * Cuántos kilómetros le agrega esta solicitud al día del voluntario.
 *
 * Es la diferencia entre su ruta con la parada nueva y su ruta sin ella. Para quien tiene el
 * día vacío es el recorrido completo (domicilio → punto de acopio), que es lo justo: ese día
 * no se mueve si no acepta.
 */
export function addedKm(volunteer: VolunteerCandidate, context: AssignmentContext): number {
  const current = estimatedRouteKm(volunteer.stopsOnDate);
  const withNew = estimatedRouteKm([...volunteer.stopsOnDate, stopFor(context)]);
  return withNew - current;
}

/**
 * ¿Este voluntario puede tomar esta solicitud?
 *
 * Las reglas 1 a 5 también las revisa el trigger `pickups_before_insert` de la base, que es la
 * última palabra. Aquí se repiten porque esta función no está validando un insert: está
 * eligiendo entre muchos voluntarios, y para eso hay que saber quién califica ANTES de
 * intentar nada.
 */
export function isCandidate(volunteer: VolunteerCandidate, context: AssignmentContext): boolean {
  const { request, limits, excludedVolunteerIds } = context;

  // 1. Está aprobado (un suspendido o pendiente no recibe recolecciones).
  if (volunteer.status !== 'approved') return false;

  // 2. Cubre el municipio de la solicitud.
  if (!volunteer.municipalityIds.includes(request.municipalityId)) return false;

  // 3. Está disponible ese día de la semana.
  if (!volunteer.availableDays.includes(weekdayOf(request.preferredDate))) return false;

  // 4. Su horario se traslapa con la ventana del donador.
  if (
    !overlaps(
      volunteer.availableFrom,
      volunteer.availableTo,
      request.preferredTimeFrom,
      request.preferredTimeTo,
    )
  ) {
    return false;
  }

  // 5. No es su propio donativo.
  if (volunteer.userId === request.donorId) return false;

  // 6. No rechazó ni dejó vencer antes esta misma solicitud.
  if (excludedVolunteerIds.includes(volunteer.id)) return false;

  // 7. Con esta parada no pasa del máximo de recolecciones del día.
  if (volunteer.stopsOnDate.length + 1 > limits.maxPickupsPerDay) return false;

  // 8. Ni del máximo del mes.
  if (volunteer.pickupsInMonth + 1 > limits.maxPickupsPerMonth) return false;

  // 9. Ni de los kilómetros estimados que puede recorrer en un día.
  const routeKm = estimatedRouteKm([...volunteer.stopsOnDate, stopFor(context)]);
  if (routeKm > limits.maxRouteKm) return false;

  return true;
}

/**
 * Elige al mejor voluntario entre los candidatos.
 *
 * Gana el que menos kilómetros agrega a su día: así el donativo recorre lo mínimo y el
 * voluntario gasta lo menos posible de su tiempo. Si empatan, gana el que lleva menos
 * recolecciones en el mes, para repartir la carga; y si siguen empatados, el de menor id, que
 * no es justo ni injusto pero hace que el resultado sea siempre el mismo y se pueda probar.
 */
export function pickVolunteer(
  volunteers: VolunteerCandidate[],
  context: AssignmentContext,
): VolunteerCandidate | null {
  const ranked = volunteers
    .filter((volunteer) => isCandidate(volunteer, context))
    .map((volunteer) => ({ volunteer, km: addedKm(volunteer, context) }))
    .sort(
      (a, b) =>
        a.km - b.km ||
        a.volunteer.pickupsInMonth - b.volunteer.pickupsInMonth ||
        a.volunteer.id.localeCompare(b.volunteer.id),
    );

  return ranked[0]?.volunteer ?? null;
}

/**
 * A qué punto de acopio va el donativo.
 *
 * La campaña que eligió el donador si sigue activa; si no, la activa más cercana a su
 * domicilio. Siempre dentro de su municipio, porque la lista que recibe ya viene filtrada: el
 * voluntario solo recoge en los municipios que declaró, y cruzar la ciudad no tendría sentido.
 *
 * Es la misma regla que el trigger `pickups_before_insert` (08_destination_same_municipality.sql).
 * Vive aquí además de en la base porque es una decisión de negocio y así se puede probar; la
 * base la vuelve a aplicar como última validación.
 */
export function chooseDestination(
  request: RequestToAssign,
  activeCampaignsInMunicipality: DestinationCampaign[],
): DestinationCampaign {
  if (activeCampaignsInMunicipality.length === 0) {
    throw new ConflictError(
      'No hay ningún punto de acopio activo en ese municipio para recibir el donativo.',
    );
  }

  const preferred = activeCampaignsInMunicipality.find((c) => c.id === request.preferredCampaignId);
  if (preferred) return preferred;

  // Reduce en lugar de sort: solo interesa el mínimo, y el empate se rompe por id para que la
  // elección sea reproducible.
  return activeCampaignsInMunicipality.reduce((best, campaign) => {
    const distance = haversineKm(request.coordinates, campaign.coordinates);
    const bestDistance = haversineKm(request.coordinates, best.coordinates);
    return distance < bestDistance || (distance === bestDistance && campaign.id < best.id)
      ? campaign
      : best;
  });
}
