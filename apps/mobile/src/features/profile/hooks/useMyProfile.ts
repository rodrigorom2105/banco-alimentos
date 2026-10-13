import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';

import { profileApi } from '../api/profileApi';

export function useMyProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  // Sin sesión no hay perfil que cargar: se resuelve en null de inmediato en vez de dejar la
  // pantalla cargando para siempre (así la vista de invitado se dibuja al instante).
  const fetcher = useCallback(
    () => (userId ? profileApi.getMine(userId) : Promise.resolve(null)),
    [userId],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { profile: data, email: user?.email ?? null, isLoading, error, reload };
}
