import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { Coordinates } from '@/shared/utils';

type Status = 'loading' | 'granted' | 'denied';
type Result = { status: Exclude<Status, 'loading'>; location: Coordinates | null };

async function requestLocation(): Promise<Result> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return { status: 'denied', location: null };
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    status: 'granted',
    location: { latitude: coords.latitude, longitude: coords.longitude },
  };
}

const DENIED: Result = { status: 'denied', location: null };

// Si el usuario niega el permiso la app sigue funcionando: solo no se muestran distancias.
export function useUserLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const apply = useCallback((result: Result) => {
    setStatus(result.status);
    setLocation(result.location);
    return result.location;
  }, []);

  useEffect(() => {
    requestLocation()
      .catch(() => DENIED)
      .then(apply);
  }, [apply]);

  // Para el botón "ubicarme": vuelve a pedir el permiso y la posición actual.
  const locate = useCallback(
    () =>
      requestLocation()
        .catch(() => DENIED)
        .then(apply),
    [apply],
  );

  return { location, status, locate };
}
