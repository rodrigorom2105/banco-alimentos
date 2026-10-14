import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';

import { donationsApi } from '../api/donationsApi';
import type { MyDonationRequest } from '../types';

const NONE: MyDonationRequest[] = [];

export function useMyDonations() {
  const { session } = useAuth();
  const fetcher = useCallback(
    () => (session ? donationsApi.listMine() : Promise.resolve(NONE)),
    [session],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { donations: data ?? NONE, isLoading, error, reload };
}

export function useMyDonation(id: string) {
  const fetcher = useCallback(() => donationsApi.getMine(id), [id]);
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { donation: data, isLoading, error, reload };
}

/**
 * Quién va a recoger la donación.
 *
 * `enabled` evita la consulta cuando la solicitud todavía no tiene recolección: ahí la función
 * devolvería 0 filas y sería una llamada de más en cada apertura de la pantalla.
 */
export function useRequestVolunteer(id: string, enabled: boolean) {
  const fetcher = useCallback(
    () => (enabled ? donationsApi.getVolunteer(id) : Promise.resolve(null)),
    [id, enabled],
  );
  const { data } = useFocusQuery(fetcher);

  return { volunteer: data };
}
