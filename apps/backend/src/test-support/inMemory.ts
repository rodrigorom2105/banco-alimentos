import type { AuthService, Clock } from '../application/ports';
import type {
  Campaign,
  CampaignReview,
  CampaignStatus,
  NewInstitutionalCampaign,
} from '../domain/campaigns/Campaign';
import type { CampaignRepository } from '../domain/campaigns/CampaignRepository';
import type { NewNotification } from '../domain/notifications/Notification';
import type { Notifier } from '../domain/notifications/Notifier';
import type {
  SupportRequest,
  SupportResponse,
  SupportStatus,
} from '../domain/support/SupportRequest';
import type { SupportRequestRepository } from '../domain/support/SupportRequestRepository';
import type { Role, UserRepository } from '../domain/users/UserRepository';
import type {
  Volunteer,
  VolunteerResubmission,
  VolunteerReview,
  VolunteerStatus,
} from '../domain/volunteers/Volunteer';
import type { VolunteerRepository } from '../domain/volunteers/VolunteerRepository';

// Adaptadores falsos para probar casos de uso y rutas sin Supabase.

export class InMemoryCampaignRepository implements CampaignRepository {
  readonly reviews: { id: string; review: CampaignReview }[] = [];
  readonly created: NewInstitutionalCampaign[] = [];

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

  async createInstitutional(data: NewInstitutionalCampaign) {
    this.created.push(data);
    const id = `institutional-${this.created.length}`;
    this.campaigns.push({
      id,
      type: 'institutional',
      // La base los deja activos; el falso imita ese comportamiento.
      status: 'active',
      name: data.name,
      organizerId: null,
      municipalityId: data.municipalityId,
      startDate: data.startDate,
      endDate: data.endDate,
      rejectionReason: null,
    });
    return id;
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

export class InMemoryVolunteerRepository implements VolunteerRepository {
  readonly reviews: { id: string; review: VolunteerReview }[] = [];
  readonly resubmissions: { id: string; data: VolunteerResubmission }[] = [];

  constructor(private readonly volunteers: Volunteer[] = []) {}

  async findById(id: string) {
    return this.volunteers.find((v) => v.id === id) ?? null;
  }

  async findByUserId(userId: string) {
    return this.volunteers.find((v) => v.userId === userId) ?? null;
  }

  async listByStatus(status: VolunteerStatus | null) {
    return status ? this.volunteers.filter((v) => v.status === status) : [...this.volunteers];
  }

  async saveReview(id: string, review: VolunteerReview) {
    this.reviews.push({ id, review });
    const volunteer = this.volunteers.find((v) => v.id === id);
    if (volunteer) {
      volunteer.status = review.status;
      volunteer.rejectionReason = review.rejectionReason;
    }
  }

  async saveResubmission(id: string, data: VolunteerResubmission) {
    this.resubmissions.push({ id, data });
    const volunteer = this.volunteers.find((v) => v.id === id);
    if (volunteer) {
      volunteer.status = 'pending';
      volunteer.rejectionReason = null;
      volunteer.availableDays = data.availableDays;
      volunteer.availableFrom = data.availableFrom;
      volunteer.availableTo = data.availableTo;
      volunteer.municipalityIds = data.municipalityIds;
    }
  }
}

export class InMemorySupportRequestRepository implements SupportRequestRepository {
  readonly responses: { id: string; response: SupportResponse }[] = [];

  constructor(private readonly requests: SupportRequest[] = []) {}

  async findById(id: string) {
    return this.requests.find((r) => r.id === id) ?? null;
  }

  async listByStatus(status: SupportStatus | null) {
    return status ? this.requests.filter((r) => r.status === status) : [...this.requests];
  }

  async saveResponse(id: string, response: SupportResponse) {
    this.responses.push({ id, response });
    const request = this.requests.find((r) => r.id === id);
    if (request) {
      request.status = response.status;
      request.responseMessage = response.responseMessage;
    }
  }
}

// Guarda los avisos en un arreglo para poder revisarlos en los tests.
export class InMemoryNotifier implements Notifier {
  readonly sent: { userId: string; notification: NewNotification }[] = [];
  readonly sentToAdmins: { notification: NewNotification; except: string | null }[] = [];

  async notify(userId: string, notification: NewNotification) {
    this.sent.push({ userId, notification });
  }

  async notifyAdmins(notification: NewNotification, except: string | null = null) {
    this.sentToAdmins.push({ notification, except });
  }
}

// Acepta tokens con el formato "token-<userId>".
export const fakeAuth: AuthService = {
  verifyToken: async (token) => (token.startsWith('token-') ? token.slice(6) : null),
};

export const fixedClock = (today: string): Clock => ({ today: () => today });

export const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111';
export const VOLUNTEER_ID = '22222222-2222-4222-8222-222222222222';
export const SUPPORT_ID = '33333333-3333-4333-8333-333333333333';

export function makeVolunteer(overrides: Partial<Volunteer> = {}): Volunteer {
  return {
    id: VOLUNTEER_ID,
    userId: 'volunteer-user',
    status: 'pending',
    firstName: 'Ana',
    lastName: 'Ramírez',
    phone: '3312345678',
    municipalityIds: [1],
    availableDays: ['mon', 'wed'],
    availableFrom: '09:00:00',
    availableTo: '13:00:00',
    photoPath: 'volunteer-user/photo.jpg',
    proofOfAddressPath: 'volunteer-user/proof-of-address.pdf',
    rejectionReason: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

export function makeSupportRequest(overrides: Partial<SupportRequest> = {}): SupportRequest {
  return {
    id: SUPPORT_ID,
    campaignId: CAMPAIGN_ID,
    campaignName: 'Campaña Col. Chapalita',
    requestedBy: 'organizer',
    type: 'containers',
    description: '3 contenedores grandes',
    neededBy: '2026-10-20',
    status: 'pending',
    responseMessage: null,
    createdAt: '2026-10-05T10:00:00.000Z',
    ...overrides,
  };
}

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
