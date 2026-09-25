import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/shared/lib/errors';

import { campaignsApi } from '../api/campaignsApi';
import type { Campaign } from '../types';

export function useCampaign(id: string | undefined) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    campaignsApi
      .getById(id)
      .then(setCampaign)
      .catch((e) => setError(getErrorMessage(e, 'No se pudo cargar la campaña')))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { campaign, isLoading, error };
}
