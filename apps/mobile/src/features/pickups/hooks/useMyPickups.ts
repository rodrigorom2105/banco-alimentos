import { useCallback } from 'react';

import { useFocusQuery } from '@/shared/hooks';

import { pickupsApi } from '../api/pickupsApi';
import type { MyPickup } from '../types';

const NONE: MyPickup[] = [];

// Solo se llama cuando el voluntario está aprobado: a quien no lo está, el backend responde con
// un 404 que no significa nada para él.
export function useMyPickups(enabled: boolean) {
  const fetcher = useCallback(
    () => (enabled ? pickupsApi.listMine() : Promise.resolve(NONE)),
    [enabled],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { pickups: data ?? NONE, isLoading, error, reload };
}
