import { FinishCampaign } from './application/campaigns/finishCampaign';
import {
  ApproveCampaign,
  ListCampaignsForReview,
  RejectCampaign,
} from './application/campaigns/reviewCampaign';
import type { AuthService, Clock } from './application/ports';
import { GrantAdminRole } from './application/users/grantAdminRole';
import type { CampaignRepository } from './domain/campaigns/CampaignRepository';
import type { UserRepository } from './domain/users/UserRepository';
import { systemClock } from './infrastructure/clock';
import type { Env } from './infrastructure/config/env';
import { createSupabaseAdmin } from './infrastructure/supabase/client';
import { SupabaseAuthService } from './infrastructure/supabase/SupabaseAuthService';
import { SupabaseCampaignRepository } from './infrastructure/supabase/SupabaseCampaignRepository';
import { SupabaseUserRepository } from './infrastructure/supabase/SupabaseUserRepository';

type Adapters = {
  campaigns: CampaignRepository;
  users: UserRepository;
  auth: AuthService;
  clock: Clock;
};

// Raíz de composición: el único lugar que conoce las implementaciones concretas y las
// conecta con los casos de uso. Las pruebas pueden pasar adaptadores en memoria.
export function buildContainer(env: Env, overrides: Partial<Adapters> = {}) {
  const db = createSupabaseAdmin(env);
  const adapters: Adapters = {
    campaigns: new SupabaseCampaignRepository(db),
    users: new SupabaseUserRepository(db),
    auth: new SupabaseAuthService(db),
    clock: systemClock,
    ...overrides,
  };

  return {
    env,
    auth: adapters.auth,
    repositories: { campaigns: adapters.campaigns, users: adapters.users },
    useCases: {
      listCampaignsForReview: new ListCampaignsForReview(adapters.campaigns),
      approveCampaign: new ApproveCampaign(adapters.campaigns, adapters.clock),
      rejectCampaign: new RejectCampaign(adapters.campaigns),
      finishCampaign: new FinishCampaign(adapters.campaigns),
      grantAdminRole: new GrantAdminRole(adapters.users),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
