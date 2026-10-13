import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';

import { notificationsApi } from '../api/notificationsApi';
import type { Notification } from '../types';

const NONE: Notification[] = [];

export function useNotifications() {
  const { session } = useAuth();
  const fetcher = useCallback(
    () => (session ? notificationsApi.list() : Promise.resolve(NONE)),
    [session],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { notifications: data ?? NONE, isLoading, error, reload };
}
