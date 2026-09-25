import { useEffect, useState } from 'react';

import { useAuth } from '@/providers';
import { getErrorMessage } from '@/shared/lib/errors';

import { profileApi } from '../api/profileApi';
import type { Profile } from '../types';

export function useMyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    profileApi
      .getMine(user.id)
      .then(setProfile)
      .catch((e) => setError(getErrorMessage(e, 'No se pudo cargar tu perfil')))
      .finally(() => setIsLoading(false));
  }, [user]);

  return { profile, email: user?.email ?? null, isLoading, error };
}
