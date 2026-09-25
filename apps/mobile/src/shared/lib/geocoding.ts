import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { Coordinates } from '@/shared/utils';

// El geocodificador nativo de expo-location no necesita API key, pero no existe en web.
export const isGeocodingAvailable = Platform.OS !== 'web';

async function ensurePermission() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  return granted;
}

// Texto → coordenadas. Se acota a Jalisco para que "Chapalita" no caiga en otro estado.
export async function geocodeAddress(text: string): Promise<Coordinates | null> {
  if (!isGeocodingAvailable || !(await ensurePermission())) return null;
  const query = /jalisco/i.test(text) ? text : `${text}, Jalisco, México`;
  const [result] = await Location.geocodeAsync(query);
  return result ? { latitude: result.latitude, longitude: result.longitude } : null;
}

export type ReverseGeocodeResult = { address: string; placeNames: string[] };

// Coordenadas → dirección legible y nombres de lugar para detectar el municipio.
export async function reverseGeocode(coords: Coordinates): Promise<ReverseGeocodeResult | null> {
  if (!isGeocodingAvailable || !(await ensurePermission())) return null;
  const [place] = await Location.reverseGeocodeAsync(coords);
  if (!place) return null;
  const street = [place.street, place.streetNumber].filter(Boolean).join(' ');
  const address = [street || place.name, place.district].filter(Boolean).join(', ');
  const placeNames = [place.city, place.subregion, place.district].filter(
    (name): name is string => !!name,
  );
  return { address: address || place.formattedAddress || '', placeNames };
}

export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  if (!(await ensurePermission())) return null;
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return { latitude: coords.latitude, longitude: coords.longitude };
}
