import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';
import { DEV_ALL_ROLES } from '@/shared/lib/devFlags';

import { profileApi } from '../api/profileApi';
import type { MyRoles } from '../types';

const NO_ROLES: MyRoles = { isAdmin: false, volunteerStatus: null };

export function useMyRoles() {
  const { user } = useAuth();
  const userId = user?.id;
  const fetcher = useCallback(
    () => (userId ? profileApi.getMyRoles(userId) : Promise.resolve(NO_ROLES)),
    [userId],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);
  const roles = data ?? NO_ROLES;

  return {
    ...roles,
    // Modo de prueba: habilita las pantallas de admin y voluntario (ver devFlags).
    isAdmin: DEV_ALL_ROLES || roles.isAdmin,
    isVolunteer: DEV_ALL_ROLES || roles.volunteerStatus === 'approved',
    isLoading,
    error,
    reload,
  };
}
