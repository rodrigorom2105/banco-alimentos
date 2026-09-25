import type { TablesInsert } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

export type NewDonationRequest = Omit<TablesInsert<'donation_requests'>, 'donor_id'>;
export type NewDonationItem = Omit<TablesInsert<'donation_items'>, 'request_id'>;

export const donationsApi = {
  // La base guarda primero la solicitud y después sus productos (así lo define el esquema);
  // la regla de "al menos un producto" se valida hasta que un voluntario la acepta.
  async createRequest(donorId: string, request: NewDonationRequest, items: NewDonationItem[]) {
    const { data, error } = await supabase
      .from('donation_requests')
      .insert({ ...request, donor_id: donorId })
      .select('id')
      .single();
    if (error) throw error;

    const { error: itemsError } = await supabase
      .from('donation_items')
      .insert(items.map((item) => ({ ...item, request_id: data.id })));
    if (itemsError) throw itemsError;

    return data.id;
  },
};
