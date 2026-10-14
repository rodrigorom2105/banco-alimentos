import { apiRequest } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';

import type {
  Campaign,
  CampaignEdit,
  CampaignStatus,
  ManagedCampaign,
  NewCampaign,
  SupportRequest,
  SupportType,
} from '../types';

const CAMPAIGN_COLUMNS = `
  id, type, name, description, address, latitude, longitude,
  start_date, end_date, schedule, contact_phone, cover_image_url,
  municipality:municipalities(id, name)
`;
const MANAGED_COLUMNS = `${CAMPAIGN_COLUMNS}, status, organizer_id, rejection_reason`;

// Respuesta del backend al cambiar el estado de una campaña.
type StatusResult = { status: CampaignStatus };

export const campaignsApi = {
  // Según el esquema solo las `active` aparecen en el mapa (y son públicas).
  async listActive(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(CAMPAIGN_COLUMNS)
      .eq('status', 'active')
      .order('name');
    if (error) throw error;
    return data;
  },

  // Las campañas a las que un donador de ese municipio puede mandar su donativo. La
  // restricción es del municipio, no de la distancia: el voluntario solo acepta
  // recolecciones de sus propios municipios (decisión 9 del plan).
  async listActiveByMunicipality(municipalityId: number): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(CAMPAIGN_COLUMNS)
      .eq('status', 'active')
      .eq('municipality_id', municipalityId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(CAMPAIGN_COLUMNS)
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // organizerId = null trae todas (solo tiene efecto para admins; RLS filtra al resto).
  async listManaged(organizerId: string | null): Promise<ManagedCampaign[]> {
    let query = supabase
      .from('campaigns')
      .select(MANAGED_COLUMNS)
      .order('created_at', { ascending: false });
    if (organizerId) query = query.eq('organizer_id', organizerId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getManaged(id: string): Promise<ManagedCampaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(MANAGED_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(organizerId: string, campaign: NewCampaign) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ ...campaign, organizer_id: organizerId })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  async update(id: string, changes: CampaignEdit) {
    const { error } = await supabase.from('campaigns').update(changes).eq('id', id);
    if (error) throw error;
  },

  // Los cambios de estado pasan por el backend: RLS no los permite desde la app y ahí viven
  // las reglas (ej. al aprobar, pasa directo a `active` si la fecha de inicio ya llegó).
  // Cada uno devuelve el estado con el que quedó la campaña.
  approve(id: string) {
    return apiRequest<StatusResult>('POST', `/admin/campaigns/${id}/approve`);
  },

  reject(id: string, reason: string) {
    return apiRequest<StatusResult>('POST', `/admin/campaigns/${id}/reject`, { reason });
  },

  // El organizador finaliza su propia campaña; un admin puede finalizar cualquiera.
  finish(id: string) {
    return apiRequest<StatusResult>('POST', `/campaigns/${id}/finish`);
  },

  async listSupportRequests(campaignId: string): Promise<SupportRequest[]> {
    const { data, error } = await supabase
      .from('support_requests')
      .select('id, type, description, status, response_message, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async requestSupport(
    campaignId: string,
    requestedBy: string,
    type: SupportType,
    description: string,
  ) {
    const { error } = await supabase
      .from('support_requests')
      .insert({ campaign_id: campaignId, requested_by: requestedBy, type, description });
    if (error) throw error;
  },
};
