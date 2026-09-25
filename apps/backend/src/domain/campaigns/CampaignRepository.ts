import type { Campaign, CampaignReview, CampaignStatus } from './Campaign';

// Puerto: el dominio define qué necesita; la infraestructura decide cómo (Supabase, memoria…).
export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  listByStatus(status: CampaignStatus | null): Promise<Campaign[]>;
  saveReview(id: string, review: CampaignReview): Promise<void>;
  markFinished(id: string): Promise<void>;
}
