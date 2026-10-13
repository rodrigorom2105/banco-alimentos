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

/**
 * Contadores de pendientes para la tarjeta de Inicio y el menú del panel.
 *
 * Se piden las tres listas en paralelo: son consultas chicas y así el admin ve de un golpe
 * cuánto trabajo tiene sin entrar a cada sección.
 */
export function usePendingCounts(isAdmin: boolean) {
  const fetcher = useCallback(async () => {
    if (!isAdmin) return { campaigns: 0, volunteers: 0, support: 0 };
    const [campaigns, volunteers, support] = await Promise.all([
      adminApi.countPendingCampaigns(),
      adminApi.listVolunteers('pending'),
      adminApi.listSupportRequests('pending'),
    ]);
    return { campaigns, volunteers: volunteers.length, support: support.length };
  }, [isAdmin]);

  const { data, isLoading, reload } = useFocusQuery(fetcher);
  return {
    counts: data ?? { campaigns: 0, volunteers: 0, support: 0 },
    isLoading,
    reload,
  };
}
