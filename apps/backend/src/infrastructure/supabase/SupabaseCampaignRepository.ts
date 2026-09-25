import type { SupabaseClient } from '@supabase/supabase-js';

import type { Campaign, CampaignReview, CampaignStatus } from '../../domain/campaigns/Campaign';
import type { CampaignRepository } from '../../domain/campaigns/CampaignRepository';

const COLUMNS =
  'id, type, status, name, organizer_id, municipality_id, start_date, end_date, rejection_reason';

type CampaignRow = {
  id: string;
  type: Campaign['type'];
  status: CampaignStatus;
  name: string;
  organizer_id: string | null;
  municipality_id: number;
  start_date: string | null;
  end_date: string | null;
  rejection_reason: string | null;
};

// Traduce entre las columnas de la base (snake_case) y la entidad del dominio.
const toCampaign = (row: CampaignRow): Campaign => ({
  id: row.id,
  type: row.type,
  status: row.status,
  name: row.name,
  organizerId: row.organizer_id,
  municipalityId: row.municipality_id,
  startDate: row.start_date,
  endDate: row.end_date,
  rejectionReason: row.rejection_reason,
});

export class SupabaseCampaignRepository implements CampaignRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.db
      .from('campaigns')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle<CampaignRow>();
    if (error) throw error;
    return data ? toCampaign(data) : null;
  }

  async listByStatus(status: CampaignStatus | null) {
    let query = this.db.from('campaigns').select(COLUMNS).order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query.returns<CampaignRow[]>();
    if (error) throw error;
    return data.map(toCampaign);
  }

  async saveReview(id: string, review: CampaignReview) {
    const { error } = await this.db
      .from('campaigns')
      .update({
        status: review.status,
        reviewed_by: review.reviewedBy,
        reviewed_at: review.reviewedAt.toISOString(),
        rejection_reason: review.rejectionReason,
      })
      .eq('id', id);
    if (error) throw error;
  }

  async markFinished(id: string) {
    const { error } = await this.db.from('campaigns').update({ status: 'finished' }).eq('id', id);
    if (error) throw error;
  }
}
