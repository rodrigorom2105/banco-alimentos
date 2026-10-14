import type { AuthService, Clock } from '../application/ports';
import type { DestinationCampaign } from '../domain/assignment/assignment';
import type { Stop } from '../domain/assignment/route';
import type {
  Campaign,
  CampaignReview,
  CampaignStatus,
  NewInstitutionalCampaign,
} from '../domain/campaigns/Campaign';
import type { CampaignRepository } from '../domain/campaigns/CampaignRepository';
import type { DonationRequest, OpenDonationRequest } from '../domain/donations/DonationRequest';
import type { DonationRequestRepository } from '../domain/donations/DonationRequestRepository';
import type { NewNotification } from '../domain/notifications/Notification';
import type { Notifier } from '../domain/notifications/Notifier';
import type { NewPickup, Pickup } from '../domain/pickups/Pickup';
import type { PickupRepository, VolunteerPickup } from '../domain/pickups/PickupRepository';
import { ConflictError } from '../domain/shared/errors';
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

// Un punto de acopio con sus coordenadas, para probar la elección de destino. Va aparte de
// `Campaign` porque la entidad del dominio no guarda coordenadas: la revisión no las necesita.
export type FakeDestination = DestinationCampaign & { municipalityId: number };

export class InMemoryCampaignRepository implements CampaignRepository {
  readonly reviews: { id: string; review: CampaignReview }[] = [];
  readonly created: NewInstitutionalCampaign[] = [];

  constructor(
    private readonly campaigns: Campaign[] = [],
    private readonly destinations: FakeDestination[] = [],
  ) {}

  async listActiveDestinations(municipalityId: number) {
    return this.destinations
      .filter((d) => d.municipalityId === municipalityId)
      .map(({ id, name, coordinates }) => ({ id, name, coordinates }));
  }

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

  async listApprovedByMunicipality(municipalityId: number) {
    return this.volunteers.filter(
      (v) => v.status === 'approved' && v.municipalityIds.includes(municipalityId),
    );
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

export class InMemoryDonationRequestRepository implements DonationRequestRepository {
  constructor(
    private readonly requests: DonationRequest[] = [],
    private readonly open: OpenDonationRequest[] = [],
  ) {}

  async findById(id: string) {
    return this.requests.find((r) => r.id === id) ?? null;
  }

  async listOpenForAssignment() {
    return [...this.open];
  }
}

/**
 * Recolección con los datos que la base resolvería con joins: la parada (coordenadas del
 * domicilio y del punto de acopio) y la fecha de la solicitud.
 */
export type FakePickup = Pickup & { stop: Stop; preferredDate: string };

export class InMemoryPickupRepository implements PickupRepository {
  readonly created: NewPickup[] = [];
  readonly cancellations: { id: string; reason: string }[] = [];
  readonly accepted: string[] = [];

  constructor(private readonly pickups: FakePickup[] = []) {}

  async findById(id: string) {
    return this.pickups.find((p) => p.id === id) ?? null;
  }

  async findActiveByRequest(requestId: string) {
    return this.pickups.find((p) => p.requestId === requestId && p.status !== 'cancelled') ?? null;
  }

  async listDeclinedVolunteerIds(requestId: string) {
    return [
      ...new Set(
        this.pickups
          .filter((p) => p.requestId === requestId && p.status === 'cancelled')
          .map((p) => p.volunteerId),
      ),
    ];
  }

  async listForVolunteer(volunteerId: string): Promise<VolunteerPickup[]> {
    return this.pickups
      .filter((p) => p.volunteerId === volunteerId && p.status !== 'cancelled')
      .map((p) => ({
        id: p.id,
        status: p.status,
        assignedAt: p.assignedAt,
        acceptedAt: p.acceptedAt,
        request: {
          id: p.requestId,
          address: 'Calle 1',
          addressReferences: null,
          municipalityName: 'Guadalajara',
          preferredDate: p.preferredDate,
          preferredTimeFrom: p.stop.timeFrom,
          preferredTimeTo: '14:00:00',
          notes: null,
          items: [],
        },
        destination: { id: p.destinationCampaignId, name: 'Centro BAMX', address: 'Av. 1' },
      }));
  }

  async listStopsByVolunteer(volunteerIds: string[], date: string) {
    const byVolunteer: Record<string, Stop[]> = {};
    for (const pickup of this.pickups) {
      if (pickup.status === 'cancelled') continue;
      if (!volunteerIds.includes(pickup.volunteerId)) continue;
      if (pickup.preferredDate !== date) continue;
      (byVolunteer[pickup.volunteerId] ??= []).push(pickup.stop);
    }
    return byVolunteer;
  }

  async countByVolunteerInMonth(volunteerIds: string[], month: string) {
    const counts: Record<string, number> = {};
    for (const pickup of this.pickups) {
      if (pickup.status === 'cancelled') continue;
      if (!volunteerIds.includes(pickup.volunteerId)) continue;
      if (!pickup.preferredDate.startsWith(month)) continue;
      counts[pickup.volunteerId] = (counts[pickup.volunteerId] ?? 0) + 1;
    }
    return counts;
  }

  // Imita el índice `pickups_one_active_per_request`: es la regla que evita que dos
  // asignaciones simultáneas dejen a dos voluntarios creyendo que la donación es suya.
  async create(pickup: NewPickup) {
    if (await this.findActiveByRequest(pickup.requestId)) {
      throw new ConflictError('Esta donación acaba de asignarse a otro voluntario.');
    }
    this.created.push(pickup);
    const id = `pickup-${this.created.length}`;
    this.pickups.push({
      id,
      ...pickup,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      acceptedAt: null,
      preferredDate: '',
      stop: {
        id,
        coordinates: { latitude: 0, longitude: 0 },
        destination: { latitude: 0, longitude: 0 },
        timeFrom: '00:00:00',
      },
    });
    return id;
  }

  async saveAcceptance(id: string) {
    this.accepted.push(id);
    const pickup = this.pickups.find((p) => p.id === id);
    if (pickup) pickup.acceptedAt = new Date().toISOString();
  }

  async saveCancellation(id: string, reason: string) {
    this.cancellations.push({ id, reason });
    const pickup = this.pickups.find((p) => p.id === id);
    if (pickup) pickup.status = 'cancelled';
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

// `now` se deriva de `today` a mediodía: así el instante y la fecha nunca se contradicen, que
// es justo el error que un reloj fijo tiene que ayudar a evitar.
export const fixedClock = (today: string): Clock => ({
  today: () => today,
  now: () => new Date(`${today}T12:00:00.000Z`),
});

export const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111';
export const VOLUNTEER_ID = '22222222-2222-4222-8222-222222222222';
export const SUPPORT_ID = '33333333-3333-4333-8333-333333333333';
export const REQUEST_ID = '44444444-4444-4444-8444-444444444444';
export const PICKUP_ID = '55555555-5555-4555-8555-555555555555';

// Centro de Guadalajara, para que las distancias de los tests sean realistas.
export const DOWNTOWN = { latitude: 20.6736, longitude: -103.344 };

export function makeDonationRequest(overrides: Partial<DonationRequest> = {}): DonationRequest {
  return {
    id: REQUEST_ID,
    donorId: 'donor',
    municipalityId: 1,
    municipalityName: 'Guadalajara',
    coordinates: DOWNTOWN,
    // Un miércoles, que es uno de los días de `makeVolunteer`.
    preferredDate: '2026-10-28',
    preferredTimeFrom: '10:00:00',
    preferredTimeTo: '12:00:00',
    preferredCampaignId: null,
    status: 'pending',
    ...overrides,
  };
}

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
