import {
  createInstitutional,
  type NewInstitutionalCampaign,
} from '../../domain/campaigns/Campaign';
import type { CampaignRepository } from '../../domain/campaigns/CampaignRepository';
import { ForbiddenError } from '../../domain/shared/errors';
import type { Actor } from '../ports';

/**
 * Dar de alta un Centro BAMX. Solo admins: el trigger de la base también lo impide, pero el
 * caso de uso lo valida porque el backend usa la llave secreta y para la base cuenta como
 * privilegiado, así que la base lo dejaría pasar.
 */
export class CreateInstitutionalCampaign {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(actor: Actor, data: NewInstitutionalCampaign) {
    if (!actor.isAdmin) {
      throw new ForbiddenError('Solo el personal de BAMX puede registrar Centros BAMX.');
    }
    const id = await this.campaigns.createInstitutional(createInstitutional(data));
    return { id };
  }
}
