import { approve, reject, type CampaignStatus } from '../../domain/campaigns/Campaign';
import type { CampaignRepository } from '../../domain/campaigns/CampaignRepository';
import { campaignApproved, campaignRejected } from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import { ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import type { Actor, Clock } from '../ports';

function assertAdmin(actor: Actor) {
  if (!actor.isAdmin) throw new ForbiddenError('Solo el personal de BAMX puede revisar campañas.');
}

async function findOrFail(campaigns: CampaignRepository, id: string) {
  const campaign = await campaigns.findById(id);
  if (!campaign) throw new NotFoundError('La campaña no existe.');
  return campaign;
}

export class ListCampaignsForReview {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(actor: Actor, status: CampaignStatus | null) {
    assertAdmin(actor);
    return this.campaigns.listByStatus(status);
  }
}

// El aviso se manda SIEMPRE después de guardar: si la regla del dominio lanza un error o la
// base rechaza el cambio, el organizador no recibe una notificación de algo que no pasó.
export class ApproveCampaign {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly clock: Clock,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, campaignId: string) {
    assertAdmin(actor);
    const campaign = await findOrFail(this.campaigns, campaignId);
    const review = approve(campaign, actor.userId, this.clock.today());
    await this.campaigns.saveReview(campaignId, review);

    if (campaign.organizerId) {
      await this.notifier.notify(
        campaign.organizerId,
        campaignApproved({ ...campaign, status: review.status }),
      );
    }
    return { status: review.status };
  }
}

export class RejectCampaign {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, campaignId: string, reason: string) {
    assertAdmin(actor);
    const campaign = await findOrFail(this.campaigns, campaignId);
    const review = reject(campaign, actor.userId, reason);
    await this.campaigns.saveReview(campaignId, review);

    if (campaign.organizerId) {
      await this.notifier.notify(
        campaign.organizerId,
        // El motivo que se guardó, ya recortado por la regla del dominio.
        campaignRejected(campaign, review.rejectionReason ?? reason),
      );
    }
    return { status: review.status };
  }
}
