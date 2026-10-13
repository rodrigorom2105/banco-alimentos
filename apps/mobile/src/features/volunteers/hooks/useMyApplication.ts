import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';

import { volunteersApi } from '../api/volunteersApi';
import type { MyVolunteerApplication } from '../types';

/**
 * La solicitud de voluntariado propia, en cualquier estado, o null si nunca se envió.
 * La usan `volunteer/apply` (para no mostrar el formulario dos veces) y, en la Fase 6,
 * "Mi voluntariado".
 */
export function useMyApplication() {
  const { user } = useAuth();
  const userId = user?.id;
  const fetcher = useCallback(
    () =>
      userId ? volunteersApi.getMine(userId) : Promise.resolve<MyVolunteerApplication | null>(null),
    [userId],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { application: data, isLoading, error, reload };
}
