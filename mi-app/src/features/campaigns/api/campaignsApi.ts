import { supabase } from '@/shared/lib/supabase';

import type { Campaign } from '../types';

const CAMPAIGN_COLUMNS = `
  id, type, name, description, address, latitude, longitude,
  start_date, end_date, schedule, contact_phone, cover_image_url,
  municipality:municipalities(id, name)
`;

export const campaignsApi = {
  // Solo las activas aparecen en el mapa; son públicas, no requieren sesión.
  async listActive(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(CAMPAIGN_COLUMNS)
      .eq('status', 'active')
      .order('name');
    if (error) throw error;
    return data;
  },
};
