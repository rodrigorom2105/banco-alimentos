import { useMemo } from 'react';

import { useActiveCampaigns } from '@/features/campaigns';
import { distanceKm } from '@/shared/utils';

import type { ExploreCampaign } from '../types';
import { useUserLocation } from './useUserLocation';

export function useExploreCampaigns() {
  const { campaigns, isLoading, isRefreshing, error, refresh } = useActiveCampaigns();
  const { location, status: locationStatus, locate } = useUserLocation();

  const items = useMemo<ExploreCampaign[]>(
    () =>
      campaigns.map((campaign) => ({
        ...campaign,
        distanceKm: location ? distanceKm(location, campaign) : null,
      })),
    [campaigns, location],
  );

  return { items, isLoading, isRefreshing, error, refresh, location, locationStatus, locate };
}
