import { useCallback } from 'react';

import { useFocusQuery } from '@/shared/hooks';

import { campaignsApi } from '../api/campaignsApi';

// Admins ven todas las campañas (organizerId = null); los voluntarios solo las suyas.
export function useManagedCampaigns(organizerId: string | null, enabled = true) {
  const fetcher = useCallback(
    () => (enabled ? campaignsApi.listManaged(organizerId) : Promise.resolve([])),
    [organizerId, enabled],
  );
  const { data, ...rest } = useFocusQuery(fetcher);
  return { campaigns: data ?? [], ...rest };
}

export function useManagedCampaign(id: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!id) return null;
    const [campaign, supportRequests] = await Promise.all([
      campaignsApi.getManaged(id),
      campaignsApi.listSupportRequests(id),
    ]);
    return campaign ? { campaign, supportRequests } : null;
  }, [id]);
  return useFocusQuery(fetcher);
}
