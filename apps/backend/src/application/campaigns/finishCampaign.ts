import { assertCanFinish } from '../../domain/campaigns/Campaign';
import type { CampaignRepository } from '../../domain/campaigns/CampaignRepository';
import { ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import type { Actor } from '../ports';

// El organizador finaliza su propia campaña; un admin puede finalizar cualquiera.
// Pasa por el backend porque RLS no deja que el organizador cambie el estado desde la app.
export class FinishCampaign {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(actor: Actor, campaignId: string) {
    const campaign = await this.campaigns.findById(campaignId);
    if (!campaign) throw new NotFoundError('La campaña no existe.');
    if (!actor.isAdmin && campaign.organizerId !== actor.userId) {
      throw new ForbiddenError('Solo el organizador o el personal de BAMX pueden finalizarla.');
    }
    assertCanFinish(campaign);
    await this.campaigns.markFinished(campaignId);
    return { status: 'finished' as const };
  }
}
