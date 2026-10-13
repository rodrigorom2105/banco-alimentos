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

  // Modo de prueba: habilita las pantallas de admin y voluntario (ver devFlags). Solo con
  // sesión; un invitado nunca debe ver esas opciones, ni siquiera en desarrollo.
  const devRoles = DEV_ALL_ROLES && !!userId;

  return {
    ...roles,
    isAdmin: devRoles || roles.isAdmin,
    isVolunteer: devRoles || roles.volunteerStatus === 'approved',
    isLoading,
    error,
    reload,
  };
}
