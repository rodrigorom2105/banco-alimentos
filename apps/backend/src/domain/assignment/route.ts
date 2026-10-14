import { haversineKm, type Coordinates } from './geo';

/**
 * Cuánto más se recorre por calles que en línea recta. 1.3 es el valor típico para una ciudad
 * con traza de cuadrícula como Guadalajara: la diagonal de una manzana se camina por dos lados.
 * Se usa para estimar, no para prometer un número exacto al voluntario.
 */
export const STREET_FACTOR = 1.3;

/**
 * Una parada del día de un voluntario: pasar por el domicilio del donador y dejar el donativo
 * en el punto de acopio que le toca.
 *
 * `timeFrom` solo se usa para decidir por dónde empieza el día, porque los voluntarios no
 * tienen coordenadas de su casa registradas (el formulario de la Fase 4 no las pide). Sin un
 * punto de partida, el primer destino lo pone el horario del donador.
 */
export type Stop = {
  id: string;
  coordinates: Coordinates;
  destination: Coordinates;
  timeFrom: string; // 'HH:MM:SS'
};

// Determinista a propósito: con el mismo conjunto de paradas el orden es siempre el mismo, así
// que dos cálculos distintos (el de la asignación y el de la ruta) nunca se contradicen.
const firstStop = (stops: Stop[]) =>
  [...stops].sort((a, b) => a.timeFrom.localeCompare(b.timeFrom) || a.id.localeCompare(b.id))[0];

/**
 * Ordena las paradas por "vecino más cercano": se arranca en una y cada vez se va a la más
 * próxima de las que faltan.
 *
 * No es la ruta óptima —ese problema (el del agente viajero) es carísimo de resolver— pero con
 * 5 paradas al día queda muy cerca y se calcula al instante.
 */
export function orderByNearest(stops: Stop[], from: Coordinates): Stop[] {
  const remaining = [...stops];
  const ordered: Stop[] = [];
  let current = from;

  while (remaining.length > 0) {
    let best = 0;
    for (let i = 1; i < remaining.length; i += 1) {
      const candidate = haversineKm(current, remaining[i].coordinates);
      const champion = haversineKm(current, remaining[best].coordinates);
      // El empate lo rompe el id para que el orden no dependa del orden de llegada.
      if (
        candidate < champion ||
        (candidate === champion && remaining[i].id < remaining[best].id)
      ) {
        best = i;
      }
    }
    const [next] = remaining.splice(best, 1);
    ordered.push(next);
    current = next.coordinates;
  }

  return ordered;
}

/**
 * Kilómetros estimados del día: los tramos entre paradas más el tramo final al punto de acopio
 * de la última, por el factor de calles.
 *
 * El día empieza en la parada con el horario más temprano, así que para un voluntario con el
 * día vacío una sola parada ya "cuesta" el tramo domicilio → punto de acopio. Eso es lo que
 * hace que, entre dos voluntarios libres, gane el que lleve el donativo más cerca de su destino.
 */
export function estimatedRouteKm(stops: Stop[]): number {
  if (stops.length === 0) return 0;

  // Sin punto de partida: se estima el mismo recorrido que vería el voluntario en su ruta.
  const ordered = orderDay(stops, null);

  let km = 0;
  for (let i = 1; i < ordered.length; i += 1) {
    km += haversineKm(ordered[i - 1].coordinates, ordered[i].coordinates);
  }
  const last = ordered[ordered.length - 1];
  km += haversineKm(last.coordinates, last.destination);

  return km * STREET_FACTOR;
}

/**
 * El recorrido del día, en orden: primero los domicilios y al final el punto de acopio.
 *
 * `from` es desde dónde arranca (la ubicación del voluntario, si dio permiso). Si no hay, se
 * empieza por la parada con el horario más temprano, que es la única referencia disponible:
 * los voluntarios no tienen coordenadas de su casa registradas.
 */
export function orderDay(stops: Stop[], from: Coordinates | null): Stop[] {
  if (stops.length === 0) return [];
  if (from) return orderByNearest(stops, from);

  const start = firstStop(stops);
  return [
    start,
    ...orderByNearest(
      stops.filter((s) => s.id !== start.id),
      start.coordinates,
    ),
  ];
}

const point = ({ latitude, longitude }: Coordinates) => `${latitude},${longitude}`;

/**
 * Abre el recorrido en Google Maps.
 *
 * Se usa la URL pública de direcciones y no la Directions API: no cuesta, no necesita llave y
 * la app de Maps ya sabe recalcular con el tráfico real. Lo que la plataforma aporta es el
 * ORDEN de las paradas; navegar lo hace Maps.
 *
 * `waypoints` tiene un límite de paradas intermedias, pero con el tope de 5 recolecciones al
 * día (Fase 8) no se alcanza.
 */
export function buildGoogleMapsUrl(
  origin: Coordinates | null,
  waypoints: Coordinates[],
  destination: Coordinates,
): string {
  const params = new URLSearchParams({ api: '1', travelmode: 'driving' });

  // Sin origen, Maps arranca donde esté el celular en ese momento, que es justo lo que se
  // quiere cuando el voluntario no dio permiso de ubicación.
  if (origin) params.set('origin', point(origin));
  params.set('destination', point(destination));
  if (waypoints.length > 0) params.set('waypoints', waypoints.map(point).join('|'));

  // `URLSearchParams` escapa la barra vertical y las comas; Maps las necesita literales.
  const query = params.toString().replace(/%7C/g, '|').replace(/%2C/g, ',');
  return `https://www.google.com/maps/dir/?${query}`;
}
