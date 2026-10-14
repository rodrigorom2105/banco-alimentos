import type { RequestToAssign } from '../assignment/assignment';
import type { PickupStatus } from '../pickups/Pickup';
import { ValidationError } from '../shared/errors';

export type DonationRequestStatus = 'pending' | 'assigned' | 'completed' | 'cancelled';

/**
 * Una solicitud de donación desde casa.
 *
 * Extiende `RequestToAssign`, que es lo que el algoritmo de asignación necesita saber de ella.
 * La separación no es un capricho: así las funciones de `assignment.ts` se pueden probar con un
 * objeto mínimo, sin inventar un estado ni datos que no usan.
 */
export type DonationRequest = RequestToAssign & {
  status: DonationRequestStatus;
  // Para los avisos: "una donación de Tonalá se quedó sin voluntario" dice más que un uuid.
  municipalityName: string;
};

// La propuesta viva de una solicitud, si tiene alguna. `acceptedAt` en null = sin responder.
export type ActiveOffer = {
  pickupId: string;
  volunteerId: string;
  volunteerName: string;
  status: PickupStatus;
  assignedAt: string;
  acceptedAt: string | null;
};

/**
 * Una solicitud como la ve el admin en "Donaciones sin voluntario". Trae los datos para
 * identificarla de un golpe (quién, dónde, cuándo) y su propuesta actual, para poder distinguir
 * "nadie la ha tomado" de "se le propuso a alguien que no contestó".
 */
export type OpenDonationRequest = DonationRequest & {
  donorName: string;
  address: string;
  itemsCount: number;
  createdAt: string;
  offer: ActiveOffer | null;
};

// Lo que el donador puede corregir de su solicitud. Es exactamente el conjunto que el trigger
// `donation_requests_before_write` deja cambiar; los productos se editan aparte.
export type DonationRequestEdit = {
  address: string;
  addressReferences: string | null;
  municipalityId: number;
  latitude: number;
  longitude: number;
  preferredDate: string;
  preferredTimeFrom: string;
  preferredTimeTo: string;
  notes: string | null;
  preferredCampaignId: string | null;
};

/**
 * Valida los datos corregidos.
 *
 * Las mismas reglas que la base (fecha no pasada, horario coherente, coordenadas en rango),
 * revisadas aquí para poder decirlas en español y por campo en lugar de devolver un error de
 * Postgres. La base las vuelve a aplicar: es la última palabra.
 */
export function editDetails(edit: DonationRequestEdit, today: string): DonationRequestEdit {
  if (!edit.address.trim()) throw new ValidationError('La dirección es obligatoria.');
  if (edit.latitude < -90 || edit.latitude > 90) {
    throw new ValidationError('La latitud debe estar entre -90 y 90.');
  }
  if (edit.longitude < -180 || edit.longitude > 180) {
    throw new ValidationError('La longitud debe estar entre -180 y 180.');
  }
  if (edit.preferredDate < today) {
    throw new ValidationError('La fecha de recolección no puede ser en el pasado.');
  }
  if (edit.preferredTimeTo <= edit.preferredTimeFrom) {
    throw new ValidationError('La hora final debe ser posterior a la inicial.');
  }
  return {
    ...edit,
    address: edit.address.trim(),
    addressReferences: edit.addressReferences?.trim() || null,
    notes: edit.notes?.trim() || null,
  };
}

/**
 * ¿El cambio invalida al voluntario que ya se eligió?
 *
 * Solo si toca algo con lo que se tomó la decisión: el municipio, dónde se recoge, el día o la
 * ventana de horario. Corregir unas referencias ("portón azul") o una nota no cambia nada, y
 * retirarle la propuesta a alguien por eso sería un maltrato absurdo.
 */
export function requiresReassignment(current: DonationRequest, edit: DonationRequestEdit): boolean {
  return (
    current.municipalityId !== edit.municipalityId ||
    current.coordinates.latitude !== edit.latitude ||
    current.coordinates.longitude !== edit.longitude ||
    current.preferredDate !== edit.preferredDate ||
    current.preferredTimeFrom !== edit.preferredTimeFrom ||
    current.preferredTimeTo !== edit.preferredTimeTo
  );
}
