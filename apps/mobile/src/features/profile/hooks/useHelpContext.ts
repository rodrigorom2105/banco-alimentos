import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';

import { profileApi } from '../api/profileApi';
import type { HelpContext } from '../types';

// Invitado: sin rol, sin solicitud y sin campañas. Las opciones que sí se le muestran (y que
// al tocarlas piden sesión) las decide `optionsFor`, no este hook.
const GUEST: HelpContext = {
  isAdmin: false,
  volunteer: null,
  myCampaigns: { count: 0, onlyName: null },
  myDonations: { count: 0, openCount: 0 },
};

export function useHelpContext() {
  const { user } = useAuth();
  const userId = user?.id;
  const fetcher = useCallback(
    () => (userId ? profileApi.getHelpContext(userId) : Promise.resolve(GUEST)),
    [userId],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { context: data ?? GUEST, isSignedIn: !!userId, isLoading, error, reload };
}
