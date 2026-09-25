import { useEffect, useState } from 'react';

import { campaignsApi } from '../api/campaignsApi';
import type { Campaign } from '../types';

const toMessage = (e: unknown) => (e instanceof Error ? e.message : 'No se pudieron cargar las campañas');

export function useActiveCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    campaignsApi
      .listActive()
      .then(setCampaigns)
      .catch((e) => setError(toMessage(e)))
      .finally(() => setIsLoading(false));
  }, []);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      setCampaigns(await campaignsApi.listActive());
      setError(null);
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  };

  return { campaigns, isLoading, isRefreshing, error, refresh };
}
