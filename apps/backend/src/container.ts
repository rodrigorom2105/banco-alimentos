import { CreateInstitutionalCampaign } from './application/campaigns/createInstitutionalCampaign';
import { FinishCampaign } from './application/campaigns/finishCampaign';
import {
  ApproveCampaign,
  ListCampaignsForReview,
  RejectCampaign,
} from './application/campaigns/reviewCampaign';
import {
  AutoAssignPickup,
  ListUnassignedDonationRequests,
} from './application/donations/autoAssignPickup';
import { UpdateDonationRequest } from './application/donations/updateDonationRequest';
import {
  AcceptPickup,
  DeclinePickup,
  ListMyPickups,
} from './application/pickups/respondToPickupOffer';
import type { AuthService, Clock } from './application/ports';
import {
  DeliverSupportRequest,
  ListSupportRequestsForReview,
  RespondSupportRequest,
} from './application/support/reviewSupportRequest';
import { GrantAdminRole } from './application/users/grantAdminRole';
import { ResubmitVolunteerApplication } from './application/volunteers/resubmitVolunteerApplication';
import {
  ApproveVolunteer,
  ListVolunteersForReview,
  ReactivateVolunteer,
  RejectVolunteer,
  SuspendVolunteer,
} from './application/volunteers/reviewVolunteer';
import type { CampaignRepository } from './domain/campaigns/CampaignRepository';
import type { DonationRequestRepository } from './domain/donations/DonationRequestRepository';
import type { Notifier } from './domain/notifications/Notifier';
import type { PickupRepository } from './domain/pickups/PickupRepository';
import type { SupportRequestRepository } from './domain/support/SupportRequestRepository';
import type { UserRepository } from './domain/users/UserRepository';
import type { VolunteerRepository } from './domain/volunteers/VolunteerRepository';
import { systemClock } from './infrastructure/clock';
import type { Env } from './infrastructure/config/env';
import { createSupabaseAdmin } from './infrastructure/supabase/client';
import { SupabaseAuthService } from './infrastructure/supabase/SupabaseAuthService';
import { SupabaseCampaignRepository } from './infrastructure/supabase/SupabaseCampaignRepository';
import { SupabaseDonationRequestRepository } from './infrastructure/supabase/SupabaseDonationRequestRepository';
import { SupabaseNotifier } from './infrastructure/supabase/SupabaseNotifier';
import { SupabasePickupRepository } from './infrastructure/supabase/SupabasePickupRepository';
import { SupabaseSupportRequestRepository } from './infrastructure/supabase/SupabaseSupportRequestRepository';
import { SupabaseUserRepository } from './infrastructure/supabase/SupabaseUserRepository';
import { SupabaseVolunteerRepository } from './infrastructure/supabase/SupabaseVolunteerRepository';

type Adapters = {
  campaigns: CampaignRepository;
  volunteers: VolunteerRepository;
  support: SupportRequestRepository;
  users: UserRepository;
  donationRequests: DonationRequestRepository;
  pickups: PickupRepository;
  auth: AuthService;
  clock: Clock;
  notifier: Notifier;
};

// Raíz de composición: el único lugar que conoce las implementaciones concretas y las
// conecta con los casos de uso. Las pruebas pueden pasar adaptadores en memoria.
export function buildContainer(env: Env, overrides: Partial<Adapters> = {}) {
  const db = createSupabaseAdmin(env);
  const adapters: Adapters = {
    campaigns: new SupabaseCampaignRepository(db),
    volunteers: new SupabaseVolunteerRepository(db),
    support: new SupabaseSupportRequestRepository(db),
    users: new SupabaseUserRepository(db),
    donationRequests: new SupabaseDonationRequestRepository(db),
    pickups: new SupabasePickupRepository(db),
    auth: new SupabaseAuthService(db),
    clock: systemClock,
    notifier: new SupabaseNotifier(db),
    ...overrides,
  };

  // Los topes de la asignación viven en la configuración, no en el código: se arman aquí una
  // sola vez y se inyectan, igual que un adaptador.
  const limits = {
    maxPickupsPerDay: env.ASSIGNMENT_MAX_PICKUPS_PER_DAY,
    maxRouteKm: env.ASSIGNMENT_MAX_ROUTE_KM,
    maxPickupsPerMonth: env.ASSIGNMENT_MAX_PICKUPS_PER_MONTH,
  };
  const offerHours = env.ASSIGNMENT_OFFER_HOURS;

  const autoAssignPickup = new AutoAssignPickup(
    adapters.donationRequests,
    adapters.pickups,
    adapters.volunteers,
    adapters.campaigns,
    adapters.notifier,
    adapters.clock,
    limits,
    offerHours,
  );

  return {
    env,
    auth: adapters.auth,
    repositories: {
      campaigns: adapters.campaigns,
      volunteers: adapters.volunteers,
      support: adapters.support,
      users: adapters.users,
      donationRequests: adapters.donationRequests,
      pickups: adapters.pickups,
    },
    useCases: {
      listCampaignsForReview: new ListCampaignsForReview(adapters.campaigns),
      approveCampaign: new ApproveCampaign(adapters.campaigns, adapters.clock, adapters.notifier),
      rejectCampaign: new RejectCampaign(adapters.campaigns, adapters.notifier),
      finishCampaign: new FinishCampaign(adapters.campaigns),
      createInstitutionalCampaign: new CreateInstitutionalCampaign(adapters.campaigns),
      listVolunteersForReview: new ListVolunteersForReview(adapters.volunteers),
      approveVolunteer: new ApproveVolunteer(adapters.volunteers, adapters.notifier),
      rejectVolunteer: new RejectVolunteer(adapters.volunteers, adapters.notifier),
      suspendVolunteer: new SuspendVolunteer(adapters.volunteers, adapters.notifier),
      reactivateVolunteer: new ReactivateVolunteer(adapters.volunteers, adapters.notifier),
      resubmitVolunteerApplication: new ResubmitVolunteerApplication(
        adapters.volunteers,
        adapters.notifier,
      ),
      listSupportRequestsForReview: new ListSupportRequestsForReview(adapters.support),
      respondSupportRequest: new RespondSupportRequest(adapters.support, adapters.notifier),
      deliverSupportRequest: new DeliverSupportRequest(adapters.support, adapters.notifier),
      grantAdminRole: new GrantAdminRole(adapters.users),
      autoAssignPickup,
      listUnassignedDonationRequests: new ListUnassignedDonationRequests(
        adapters.donationRequests,
        adapters.clock,
        offerHours,
      ),
      listMyPickups: new ListMyPickups(adapters.pickups, adapters.volunteers),
      acceptPickup: new AcceptPickup(
        adapters.pickups,
        adapters.volunteers,
        adapters.donationRequests,
        adapters.notifier,
      ),
      // Rechazar reasigna: por eso recibe el caso de uso de asignación, no un repositorio.
      declinePickup: new DeclinePickup(adapters.pickups, adapters.volunteers, autoAssignPickup),
      // Editar también puede reasignar, si cambia el día, el horario o dónde se recoge.
      updateDonationRequest: new UpdateDonationRequest(
        adapters.donationRequests,
        adapters.pickups,
        adapters.volunteers,
        adapters.notifier,
        autoAssignPickup,
        adapters.clock,
      ),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
