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
  InMemoryNotifier,
  fixedClock,
  makeCampaign,
} from '../../test-support/inMemory';
import { CreateInstitutionalCampaign } from './createInstitutionalCampaign';
import { FinishCampaign } from './finishCampaign';
import { ApproveCampaign, ListCampaignsForReview, RejectCampaign } from './reviewCampaign';

const admin = { userId: 'admin', isAdmin: true };
const organizer = { userId: 'organizer', isAdmin: false };
const stranger = { userId: 'stranger', isAdmin: false };

const TODAY = '2026-09-25';

// El notificador en memoria reemplaza a Supabase: guarda los avisos en un arreglo que el test
// puede revisar.
const approveWith = (repo: InMemoryCampaignRepository, today = TODAY) => {
  const notifier = new InMemoryNotifier();
  return { useCase: new ApproveCampaign(repo, fixedClock(today), notifier), notifier };
};

const rejectWith = (repo: InMemoryCampaignRepository) => {
  const notifier = new InMemoryNotifier();
  return { useCase: new RejectCampaign(repo, notifier), notifier };
};

describe('ApproveCampaign', () => {
  it('deja la campaña como approved si todavía no empieza', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ startDate: '2026-10-01' })]);
    const result = await approveWith(repo).useCase.execute(admin, CAMPAIGN_ID);
    expect(result.status).toBe('approved');
    expect(repo.reviews[0].review).toMatchObject({ reviewedBy: 'admin', rejectionReason: null });
  });

  it('la activa directamente si la fecha de inicio ya llegó', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ startDate: TODAY })]);
    const result = await approveWith(repo).useCase.execute(admin, CAMPAIGN_ID);
    expect(result.status).toBe('active');
  });

  it('notifica al organizador, con el estado con el que quedó', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ startDate: TODAY })]);
    const { useCase, notifier } = approveWith(repo);
    await useCase.execute(admin, CAMPAIGN_ID);

    expect(notifier.sent).toHaveLength(1);
    expect(notifier.sent[0].userId).toBe('organizer');
    expect(notifier.sent[0].notification).toMatchObject({
      type: 'campaign_approved',
      data: { campaignId: CAMPAIGN_ID },
    });
    // Quedó activa, así que el mensaje debe decir que ya se ve.
    expect(notifier.sent[0].notification.body).toContain('ya aparece en Explorar');
  });

  it('rechaza a quien no es admin', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign()]);
    const { useCase, notifier } = approveWith(repo);
    await expect(useCase.execute(organizer, CAMPAIGN_ID)).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.reviews).toHaveLength(0);
    // Nada de avisos de algo que no pasó.
    expect(notifier.sent).toHaveLength(0);
  });

  it('no aprueba una campaña que ya no está pendiente, ni notifica', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'rejected' })]);
    const { useCase, notifier } = approveWith(repo);
    await expect(useCase.execute(admin, CAMPAIGN_ID)).rejects.toBeInstanceOf(ConflictError);
    expect(notifier.sent).toHaveLength(0);
  });

  it('avisa si la campaña no existe', async () => {
    const repo = new InMemoryCampaignRepository([]);
    const { useCase, notifier } = approveWith(repo);
    await expect(useCase.execute(admin, CAMPAIGN_ID)).rejects.toBeInstanceOf(NotFoundError);
    expect(notifier.sent).toHaveLength(0);
  });

  // Los centros BAMX no tienen organizador: no hay a quién avisarle, y no debe tronar.
  it('no intenta notificar si la campaña no tiene organizador', async () => {
    const repo = new InMemoryCampaignRepository([
      makeCampaign({ type: 'institutional', organizerId: null }),
    ]);
    const { useCase, notifier } = approveWith(repo);
    await useCase.execute(admin, CAMPAIGN_ID);
    expect(notifier.sent).toHaveLength(0);
  });
});

describe('RejectCampaign', () => {
  it('guarda el motivo del rechazo', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign()]);
    const result = await rejectWith(repo).useCase.execute(admin, CAMPAIGN_ID, '  Falta dirección ');
    expect(result.status).toBe('rejected');
    expect(repo.reviews[0].review.rejectionReason).toBe('Falta dirección');
  });

  it('notifica al organizador con el motivo', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign()]);
    const { useCase, notifier } = rejectWith(repo);
    await useCase.execute(admin, CAMPAIGN_ID, '  Falta dirección ');

    expect(notifier.sent).toHaveLength(1);
    expect(notifier.sent[0].userId).toBe('organizer');
    expect(notifier.sent[0].notification.type).toBe('campaign_rejected');
    // El motivo viaja ya recortado por la regla del dominio.
    expect(notifier.sent[0].notification.body).toContain('Falta dirección');
  });

  it('exige un motivo y no notifica', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign()]);
    const { useCase, notifier } = rejectWith(repo);
    await expect(useCase.execute(admin, CAMPAIGN_ID, '   ')).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(notifier.sent).toHaveLength(0);
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

  // Cancelar una campaña aprobada que todavía no empieza. La base lo permite desde el SQL
  // 05_campaign_status_transitions (antes solo aceptaba active -> finished y esto daba un 500).
  it('el organizador puede finalizar su campaña aprobada que aún no empieza', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'approved' })]);
    await expect(new FinishCampaign(repo).execute(organizer, CAMPAIGN_ID)).resolves.toEqual({
      status: 'finished',
    });
  });

  it('no se finaliza una campaña ya finalizada', async () => {
    const repo = new InMemoryCampaignRepository([makeCampaign({ status: 'finished' })]);
    await expect(new FinishCampaign(repo).execute(organizer, CAMPAIGN_ID)).rejects.toBeInstanceOf(
      ConflictError,
    );
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

describe('CreateInstitutionalCampaign', () => {
  const center = {
    name: '  Centro BAMX Zapopan ',
    description: null,
    address: 'Av. Patria 123',
    municipalityId: 2,
    latitude: 20.72,
    longitude: -103.41,
    startDate: null,
    endDate: null,
    schedule: 'Lun a Vie 9:00-17:00',
    contactPhone: null,
  };

  it('lo crea sin organizador y la base lo deja activo', async () => {
    const repo = new InMemoryCampaignRepository([]);
    const { id } = await new CreateInstitutionalCampaign(repo).execute(admin, center);

    expect(repo.created[0].name).toBe('Centro BAMX Zapopan'); // recortado por el dominio
    const created = await repo.findById(id);
    expect(created).toMatchObject({ type: 'institutional', status: 'active', organizerId: null });
  });

  // end_date en null = punto permanente, por eso las fechas son opcionales.
  it('acepta un centro permanente, sin fechas', async () => {
    const repo = new InMemoryCampaignRepository([]);
    const { id } = await new CreateInstitutionalCampaign(repo).execute(admin, center);
    expect((await repo.findById(id))?.endDate).toBeNull();
  });

  it('exige nombre', async () => {
    const repo = new InMemoryCampaignRepository([]);
    await expect(
      new CreateInstitutionalCampaign(repo).execute(admin, { ...center, name: '   ' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('valida que las coordenadas existan en el planeta', async () => {
    const repo = new InMemoryCampaignRepository([]);
    await expect(
      new CreateInstitutionalCampaign(repo).execute(admin, { ...center, latitude: 120 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza una fecha de fin anterior a la de inicio', async () => {
    const repo = new InMemoryCampaignRepository([]);
    await expect(
      new CreateInstitutionalCampaign(repo).execute(admin, {
        ...center,
        startDate: '2026-10-10',
        endDate: '2026-10-01',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('solo admins', async () => {
    const repo = new InMemoryCampaignRepository([]);
    await expect(
      new CreateInstitutionalCampaign(repo).execute(organizer, center),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.created).toHaveLength(0);
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
