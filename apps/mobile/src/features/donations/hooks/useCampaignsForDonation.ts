import { useCallback } from 'react';

import { campaignsApi, type Campaign } from '@/features/campaigns';
import { useFocusQuery } from '@/shared/hooks';

const NONE: Campaign[] = [];

/**
 * Campañas activas del municipio elegido en el domicilio.
 *
 * Usa `useFocusQuery` como el resto del repo. Además de recargar al enfocar la pantalla,
 * vuelve a consultar cuando cambia `municipalityId`: el `fetcher` cambia de identidad y el
 * efecto de foco se vuelve a ejecutar. O sea, elegir otro municipio recarga la lista sin
 * salir del formulario.
 */
export function useCampaignsForDonation(municipalityId: number | null) {
  const fetcher = useCallback(
    () =>
      municipalityId === null
        ? Promise.resolve(NONE)
        : campaignsApi.listActiveByMunicipality(municipalityId),
    [municipalityId],
  );
  const { data, isLoading, error } = useFocusQuery(fetcher);

  return { campaigns: data ?? NONE, isLoading, error };
}
