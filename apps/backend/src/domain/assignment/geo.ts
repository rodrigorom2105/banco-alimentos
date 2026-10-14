export type Coordinates = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Distancia en línea recta entre dos puntos (fórmula de haversine).
 *
 * "Haversine" calcula la distancia sobre la superficie de la Tierra, que es una esfera, no un
 * plano: si se restaran las coordenadas como si fuera un mapa plano el error crecería mucho
 * con la distancia. Para comparar qué tan lejos están dos domicilios de Guadalajara es de
 * sobra.
 *
 * No es la distancia por calles —nadie viaja en línea recta—, así que `route.ts` la multiplica
 * por un factor antes de usarla como estimación de recorrido.
 */
export function haversineKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}
