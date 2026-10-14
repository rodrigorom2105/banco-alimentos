import { useCallback } from 'react';

import { useAuth } from '@/providers';
import { useFocusQuery } from '@/shared/hooks';

import { donationsApi } from '../api/donationsApi';
import type { MyDonationRequest } from '../types';

const NONE: MyDonationRequest[] = [];

export function useMyDonations() {
  const { session } = useAuth();
  const fetcher = useCallback(
    () => (session ? donationsApi.listMine() : Promise.resolve(NONE)),
    [session],
  );
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { donations: data ?? NONE, isLoading, error, reload };
}

export function useMyDonation(id: string) {
  const fetcher = useCallback(() => donationsApi.getMine(id), [id]);
  const { data, isLoading, error, reload } = useFocusQuery(fetcher);

  return { donation: data, isLoading, error, reload };
}
