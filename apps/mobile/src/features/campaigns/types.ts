import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/shared/lib/database.types';

export type CampaignType = Enums<'campaign_type'>;
export type CampaignStatus = Enums<'campaign_status'>;
export type SupportType = Enums<'support_type'>;
export type SupportStatus = Enums<'support_status'>;

export type Campaign = Pick<
  Tables<'campaigns'>,
  | 'id'
  | 'type'
  | 'name'
  | 'description'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'start_date'
  | 'end_date'
  | 'schedule'
  | 'contact_phone'
  | 'cover_image_url'
> & {
  municipality: Pick<Tables<'municipalities'>, 'id' | 'name'> | null;
};

// Lo que ve el organizador o un admin al administrar la campaña.
export type ManagedCampaign = Campaign &
  Pick<Tables<'campaigns'>, 'status' | 'organizer_id' | 'rejection_reason'>;

export type NewCampaign = Omit<TablesInsert<'campaigns'>, 'organizer_id'>;

// Todos los datos del formulario son editables. Ojo: el esquema original solo deja al
// organizador cambiar nombre, descripción, horario y portada, así que RLS podría rechazar
// cambios de tipo, ubicación o fechas hasta que se ajuste la política.
export type CampaignEdit = Omit<
  TablesUpdate<'campaigns'>,
  'status' | 'reviewed_by' | 'reviewed_at' | 'rejection_reason'
>;

export type SupportRequest = Pick<
  Tables<'support_requests'>,
  'id' | 'type' | 'description' | 'status' | 'response_message' | 'created_at'
>;
