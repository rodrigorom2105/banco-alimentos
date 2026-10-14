import { useCallback } from 'react';

import { useFocusQuery } from '@/shared/hooks';

import { adminApi } from '../api/adminApi';
import type { SupportStatus, VolunteerStatus } from '../types';

export function useVolunteersForReview(status: VolunteerStatus | null) {
  const fetcher = useCallback(() => adminApi.listVolunteers(status), [status]);
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);
  return { volunteers: data ?? [], isLoading, error, reload };
}

// El detalle sale de la misma lista en lugar de un endpoint aparte: son pocas solicitudes y
// así no hay que mantener una ruta más en el backend.
export function useVolunteerForReview(id: string) {
  const fetcher = useCallback(
    () => adminApi.listVolunteers(null).then((list) => list.find((v) => v.id === id) ?? null),
    [id],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);
  return { volunteer: data, isLoading, error, reload };
}

export function useSupportRequestsForReview(status: SupportStatus | null) {
  const fetcher = useCallback(() => adminApi.listSupportRequests(status), [status]);
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);
  return { requests: data ?? [], isLoading, error, reload };
}

export function useUnassignedDonations() {
  const fetcher = useCallback(() => adminApi.listUnassignedDonations(), []);
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);
  return { donations: data ?? [], isLoading, error, reload };
}

const NO_COUNTS = { campaigns: 0, volunteers: 0, support: 0, donations: 0 };

/**
 * Contadores de pendientes para la tarjeta de Inicio y el menú del panel.
 *
 * Se piden las listas en paralelo: son consultas chicas y así el admin ve de un golpe cuánto
 * trabajo tiene sin entrar a cada sección.
 *
 * `allSettled` y no `all`: un contador es un extra, no el contenido de la pantalla. Con `all`,
 * una sola consulta caída dejaba los cuatro en cero, que se lee como "no tienes nada que hacer"
 * —justo lo contrario de la verdad—. Así cada sección muestra su número si lo pudo traer, y el
 * error de fondo se ve al entrar a la sección, que es donde sirve.
 */
export function usePendingCounts(isAdmin: boolean) {
  const fetcher = useCallback(async () => {
    if (!isAdmin) return NO_COUNTS;
    const [campaigns, volunteers, support, donations] = await Promise.allSettled([
      adminApi.countPendingCampaigns(),
      adminApi.listVolunteers('pending'),
      adminApi.listSupportRequests('pending'),
      adminApi.listUnassignedDonations(),
    ]);
    return {
      campaigns: campaigns.status === 'fulfilled' ? campaigns.value : 0,
      volunteers: volunteers.status === 'fulfilled' ? volunteers.value.length : 0,
      support: support.status === 'fulfilled' ? support.value.length : 0,
      donations: donations.status === 'fulfilled' ? donations.value.length : 0,
    };
  }, [isAdmin]);

  const { data, isLoading, reload } = useFocusQuery(fetcher);
  return { counts: data ?? NO_COUNTS, isLoading, reload };
}
