import type { TablesInsert } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

import type { MyDonationRequest } from '../types';

export type NewDonationRequest = Omit<TablesInsert<'donation_requests'>, 'donor_id'>;
export type NewDonationItem = Omit<TablesInsert<'donation_items'>, 'request_id'>;

const REQUEST_COLUMNS = `
  id, address, address_references, preferred_date,
  preferred_time_from, preferred_time_to, notes,
  status, cancellation_reason, created_at,
  municipality:municipalities(name),
  preferred_campaign:campaigns(name),
  items:donation_items(
    id, description, quantity, unit, collected_quantity,
    category:product_categories(name)
  )
`;

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

  // RLS solo deja ver las solicitudes propias, así que no hace falta filtrar por donor_id.
  async listMine(): Promise<MyDonationRequest[]> {
    const { data, error } = await supabase
      .from('donation_requests')
      .select(REQUEST_COLUMNS)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MyDonationRequest[];
  },

  async getMine(id: string): Promise<MyDonationRequest | null> {
    const { data, error } = await supabase
      .from('donation_requests')
      .select(REQUEST_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as MyDonationRequest | null;
  },

  /**
   * Cancela una solicitud propia.
   *
   * No pasa por el backend: el esquema deja que el donador cancele mientras esté `pending` o
   * `assigned`, y el trigger `donation_requests_before_write` valida la transición. Si ya
   * había un voluntario asignado, otro trigger cancela su recolección automáticamente.
   */
  async cancel(id: string, reason: string) {
    const { error } = await supabase
      .from('donation_requests')
      .update({ status: 'cancelled', cancellation_reason: reason.trim() })
      .eq('id', id);
    if (error) throw error;
  },
};
