import { describe, expect, it } from 'vitest';

import { ConflictError, ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import {
  InMemoryNotifier,
  InMemoryVolunteerRepository,
  makeVolunteer,
  VOLUNTEER_ID,
} from '../../test-support/inMemory';
import {
  ApproveVolunteer,
  ListVolunteersForReview,
  RejectVolunteer,
  SuspendVolunteer,
} from './reviewVolunteer';

const admin = { userId: 'admin', isAdmin: true };
const stranger = { userId: 'stranger', isAdmin: false };

const setup = (repo: InMemoryVolunteerRepository) => {
  const notifier = new InMemoryNotifier();
  return {
    notifier,
    approve: new ApproveVolunteer(repo, notifier),
    reject: new RejectVolunteer(repo, notifier),
    suspend: new SuspendVolunteer(repo, notifier),
  };
};

describe('ApproveVolunteer', () => {
  it('aprueba y notifica al voluntario', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer()]);
    const { approve, notifier } = setup(repo);

    await expect(approve.execute(admin, VOLUNTEER_ID)).resolves.toEqual({ status: 'approved' });
    expect(repo.reviews[0].review).toMatchObject({ reviewedBy: 'admin', rejectionReason: null });
    expect(notifier.sent).toHaveLength(1);
    expect(notifier.sent[0].userId).toBe('volunteer-user');
    expect(notifier.sent[0].notification.type).toBe('volunteer_approved');
  });

  // La base exige al menos un municipio antes de aprobar; aquí el error se explica en español
  // en lugar de salir como un 500 de Postgres.
  it('no aprueba a quien no cubre ningún municipio', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ municipalityIds: [] })]);
    const { approve, notifier } = setup(repo);

    await expect(approve.execute(admin, VOLUNTEER_ID)).rejects.toBeInstanceOf(ConflictError);
    expect(repo.reviews).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it('no aprueba una solicitud que ya fue revisada', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'approved' })]);
    const { approve } = setup(repo);
    await expect(approve.execute(admin, VOLUNTEER_ID)).rejects.toBeInstanceOf(ConflictError);
  });

  it('rechaza a quien no es admin, sin notificar', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer()]);
    const { approve, notifier } = setup(repo);
    await expect(approve.execute(stranger, VOLUNTEER_ID)).rejects.toBeInstanceOf(ForbiddenError);
    expect(notifier.sent).toHaveLength(0);
  });

  it('avisa si la solicitud no existe', async () => {
    const repo = new InMemoryVolunteerRepository([]);
    const { approve } = setup(repo);
    await expect(approve.execute(admin, VOLUNTEER_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('RejectVolunteer', () => {
  it('guarda el motivo y lo manda en la notificación', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer()]);
    const { reject, notifier } = setup(repo);

    await reject.execute(admin, VOLUNTEER_ID, '  El comprobante no es legible. ');

    expect(repo.reviews[0].review.rejectionReason).toBe('El comprobante no es legible.');
    expect(notifier.sent[0].notification.type).toBe('volunteer_rejected');
    expect(notifier.sent[0].notification.body).toContain('El comprobante no es legible.');
  });

  it('exige un motivo', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer()]);
    const { reject, notifier } = setup(repo);
    await expect(reject.execute(admin, VOLUNTEER_ID, '   ')).rejects.toThrow(
      /motivo para rechazar/,
    );
    expect(notifier.sent).toHaveLength(0);
  });
});

describe('SuspendVolunteer', () => {
  it('suspende a un voluntario aprobado y le avisa', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'approved' })]);
    const { suspend, notifier } = setup(repo);

    await expect(
      suspend.execute(admin, VOLUNTEER_ID, 'Canceló tres recolecciones.'),
    ).resolves.toEqual({ status: 'suspended' });
    expect(notifier.sent[0].notification.type).toBe('volunteer_suspended');
  });

  // Suspender a alguien que nunca fue aprobado no significa nada.
  it('no suspende a quien está pendiente', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'pending' })]);
    const { suspend } = setup(repo);
    await expect(suspend.execute(admin, VOLUNTEER_ID, 'Cualquier motivo')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('exige un motivo', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'approved' })]);
    const { suspend } = setup(repo);
    await expect(suspend.execute(admin, VOLUNTEER_ID, '  ')).rejects.toThrow(
      /motivo para suspender/,
    );
  });
});

describe('ListVolunteersForReview', () => {
  it('filtra por estado y es solo para admins', async () => {
    const repo = new InMemoryVolunteerRepository([
      makeVolunteer(),
      makeVolunteer({ id: 'otro', status: 'approved' }),
    ]);
    const useCase = new ListVolunteersForReview(repo);

    expect(await useCase.execute(admin, 'pending')).toHaveLength(1);
    expect(await useCase.execute(admin, null)).toHaveLength(2);
    await expect(useCase.execute(stranger, null)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
