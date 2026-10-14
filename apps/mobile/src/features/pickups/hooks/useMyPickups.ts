import { useCallback } from 'react';

import { useFocusQuery } from '@/shared/hooks';

import { pickupsApi } from '../api/pickupsApi';
import type { MyPickup, PickupSummary } from '../types';

const NONE: MyPickup[] = [];
const NO_SUMMARY: PickupSummary = { active: 0, deliveredThisMonth: 0 };

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

export function usePickupSummary(enabled: boolean) {
  const fetcher = useCallback(
    () => (enabled ? pickupsApi.summary() : Promise.resolve(NO_SUMMARY)),
    [enabled],
  );
  const { data, reload } = useFocusQuery(fetcher);

  return { summary: data ?? NO_SUMMARY, reload };
}

// El detalle sale de la misma lista en lugar de un endpoint aparte: son pocas recolecciones y
// así no hay que mantener una ruta más en el backend.
export function useMyPickup(id: string) {
  const fetcher = useCallback(
    () => pickupsApi.listMine().then((list) => list.find((p) => p.id === id) ?? null),
    [id],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { pickup: data, isLoading, error, reload };
}
