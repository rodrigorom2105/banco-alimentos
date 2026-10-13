import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';

import { notificationsApi } from '../api/notificationsApi';

/**
 * Contador de la campana. Se actualiza cada vez que la pantalla recibe el foco (useFocusQuery),
 * así que al volver del buzón ya refleja lo que se leyó. Sin sesión siempre es 0.
 */
export function useUnreadCount() {
  const { session } = useAuth();
  const fetcher = useCallback(
    () => (session ? notificationsApi.unreadCount() : Promise.resolve(0)),
    [session],
  );
  const { data, reload } = useFocusQuery(fetcher);

  return { unreadCount: data ?? 0, reload };
}
