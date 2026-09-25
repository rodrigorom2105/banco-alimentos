import type { AuthService, Clock } from '../application/ports';
import type { Campaign, CampaignReview, CampaignStatus } from '../domain/campaigns/Campaign';
import type { CampaignRepository } from '../domain/campaigns/CampaignRepository';
import type { Role, UserRepository } from '../domain/users/UserRepository';

// Adaptadores falsos para probar casos de uso y rutas sin Supabase.

export class InMemoryCampaignRepository implements CampaignRepository {
  readonly reviews: { id: string; review: CampaignReview }[] = [];

  constructor(private readonly campaigns: Campaign[] = []) {}

  async findById(id: string) {
    return this.campaigns.find((c) => c.id === id) ?? null;
  }

  async listByStatus(status: CampaignStatus | null) {
    return status ? this.campaigns.filter((c) => c.status === status) : [...this.campaigns];
  }

  async saveReview(id: string, review: CampaignReview) {
    this.reviews.push({ id, review });
    const campaign = this.campaigns.find((c) => c.id === id);
    if (campaign) {
      campaign.status = review.status;
      campaign.rejectionReason = review.rejectionReason;
    }
  }

  async markFinished(id: string) {
    const campaign = this.campaigns.find((c) => c.id === id);
    if (campaign) campaign.status = 'finished';
  }
}

export class InMemoryUserRepository implements UserRepository {
  readonly roles = new Map<string, Set<Role>>();
  readonly grants: { userId: string; grantedBy: string | null }[] = [];

  constructor(private readonly emails: Record<string, string> = {}) {}

  async findIdByEmail(email: string) {
    return this.emails[email] ?? null;
  }

  async hasRole(userId: string, role: Role) {
    return this.roles.get(userId)?.has(role) ?? false;
  }

  async grantRole(userId: string, role: Role, grantedBy: string | null) {
    this.roles.set(userId, new Set([...(this.roles.get(userId) ?? []), role]));
    this.grants.push({ userId, grantedBy });
  }
}

// Acepta tokens con el formato "token-<userId>".
export const fakeAuth: AuthService = {
  verifyToken: async (token) => (token.startsWith('token-') ? token.slice(6) : null),
};

export const fixedClock = (today: string): Clock => ({ today: () => today });

export const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111';

export function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: CAMPAIGN_ID,
    type: 'community',
    status: 'pending',
    name: 'Campaña Col. Chapalita',
    organizerId: 'organizer',
    municipalityId: 1,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    rejectionReason: null,
    ...overrides,
  };
}
