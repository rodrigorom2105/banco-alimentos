import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  SupportRequest,
  SupportResponse,
  SupportStatus,
  SupportType,
} from '../../domain/support/SupportRequest';
import type { SupportRequestRepository } from '../../domain/support/SupportRequestRepository';

// Se trae el nombre de la campaña en la misma consulta: el admin necesita saber de qué
// campaña viene la solicitud para poder decidir.
const COLUMNS = `
  id, campaign_id, requested_by, type, description, needed_by,
  status, response_message, created_at,
  campaign:campaigns!support_requests_campaign_id_fkey(name)
`;

type SupportRow = {
  id: string;
  campaign_id: string;
  requested_by: string;
  type: SupportType;
  description: string;
  needed_by: string | null;
  status: SupportStatus;
  response_message: string | null;
  created_at: string;
  campaign: { name: string } | null;
};

const toRequest = (row: SupportRow): SupportRequest => ({
  id: row.id,
  campaignId: row.campaign_id,
  campaignName: row.campaign?.name ?? '',
  requestedBy: row.requested_by,
  type: row.type,
  description: row.description,
  neededBy: row.needed_by,
  status: row.status,
  responseMessage: row.response_message,
  createdAt: row.created_at,
});

export class SupabaseSupportRequestRepository implements SupportRequestRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.db
      .from('support_requests')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle<SupportRow>();
    if (error) throw error;
    return data ? toRequest(data) : null;
  }

  async listByStatus(status: SupportStatus | null) {
    let query = this.db
      .from('support_requests')
      .select(COLUMNS)
      .order('created_at', { ascending: true });
    if (status) query = query.eq('status', status);
    const { data, error } = await query.returns<SupportRow[]>();
    if (error) throw error;
    return data.map(toRequest);
  }

  async saveResponse(id: string, response: SupportResponse) {
    // `reviewed_by` explícito, igual que en las campañas: auth.uid() es null para el backend.
    const { error } = await this.db
      .from('support_requests')
      .update({
        status: response.status,
        response_message: response.responseMessage,
        reviewed_by: response.reviewedBy,
        reviewed_at: response.reviewedAt.toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  }
}
