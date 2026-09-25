import { describe, expect, it } from 'vitest';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../domain/shared/errors';
import {
  CAMPAIGN_ID,
  InMemoryCampaignRepository,
  fixedClock,
  makeCampaign,
} from '../../test-support/inMemory';
import { FinishCampaign } from './finishCampaign';
import { ApproveCampaign, ListCampaignsForReview, RejectCampaign } from './reviewCampaign';

const admin = { userId: 'admin', isAdmin: true };
const organizer = { userId: 'organizer', isAdmin: false };
const stranger = { userId: 'stranger', isAdmin: false };

describe('ApproveCampaign', () => {
  it('deja la campaña como approved si todavía no empieza', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ startDate: '2026-10-01' })]);
    const result = await new ApproveCampaign(repo, fixedClock('2026-09-25')).execute(
      admin,
      CAMPAIGN_ID,
    );
    expect(result.status).toBe('approved');
    expect(repo.reviews[0].review).toMatchObject({ reviewedBy: 'admin', rejectionReason: null });
  });

  it('la activa directamente si la fecha de inicio ya llegó', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ startDate: '2026-09-25' })]);
    const result = await new ApproveCampaign(repo, fixedClock('2026-09-25')).execute(
      admin,
      CAMPAIGN_ID,
    );
    expect(result.status).toBe('active');
  });

  it('rechaza a quien no es admin', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign()]);
    await expect(
      new ApproveCampaign(repo, fixedClock('2026-09-25')).execute(organizer, CAMPAIGN_ID),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.reviews).toHaveLength(0);
  });

  it('no aprueba una campaña que ya no está pendiente', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'rejected' })]);
    await expect(
      new ApproveCampaign(repo, fixedClock('2026-09-25')).execute(admin, CAMPAIGN_ID),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('avisa si la campaña no existe', async () => {
    const repo = new InMemoryCampaignRepository([]);
    await expect(
      new ApproveCampaign(repo, fixedClock('2026-09-25')).execute(admin, CAMPAIGN_ID),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('RejectCampaign', () => {
  it('guarda el motivo del rechazo', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign()]);
    const result = await new RejectCampaign(repo).execute(admin, CAMPAIGN_ID, '  Falta dirección ');
    expect(result.status).toBe('rejected');
    expect(repo.reviews[0].review.rejectionReason).toBe('Falta dirección');
  });

  it('exige un motivo', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign()]);
    await expect(
      new RejectCampaign(repo).execute(admin, CAMPAIGN_ID, '   '),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('FinishCampaign', () => {
  it('el organizador puede finalizar su campaña activa', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'active' })]);
    await new FinishCampaign(repo).execute(organizer, CAMPAIGN_ID);
    expect((await repo.findById(CAMPAIGN_ID))?.status).toBe('finished');
  });

  it('un admin puede finalizar cualquier campaña en curso', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'approved' })]);
    await expect(new FinishCampaign(repo).execute(admin, CAMPAIGN_ID)).resolves.toEqual({
      status: 'finished',
    });
  });

  it('otro usuario no puede finalizarla', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'active' })]);
    await expect(new FinishCampaign(repo).execute(stranger, CAMPAIGN_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('no se finaliza una campaña pendiente', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'pending' })]);
    await expect(new FinishCampaign(repo).execute(organizer, CAMPAIGN_ID)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe('ListCampaignsForReview', () => {
  it('filtra por estado y es solo para admins', async () => {
    const repo = new InMemoryCampaignRepository([
      makeCampaign(),
      makeCampaign({ id: 'otra', status: 'active' }),
    ]);
    const list = new ListCampaignsForReview(repo);
    expect(await list.execute(admin, 'pending')).toHaveLength(1);
    expect(await list.execute(admin, null)).toHaveLength(2);
    await expect(list.execute(organizer, null)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
