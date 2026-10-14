import { describe, expect, it } from 'vitest';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../domain/shared/errors';
import {
  InMemoryNotifier,
  InMemoryVolunteerRepository,
  makeVolunteer,
  VOLUNTEER_ID,
} from '../../test-support/inMemory';
import { ResubmitVolunteerApplication } from './resubmitVolunteerApplication';
import {
  ApproveVolunteer,
  ListVolunteersForReview,
  ReactivateVolunteer,
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
    reactivate: new ReactivateVolunteer(repo, notifier),
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

// Sin esto, suspender no tendría vuelta: `approve` solo funciona desde `pending` y la persona
// no puede reenviar su solicitud. Un error al suspender quedaba sin forma de deshacerse.
describe('ReactivateVolunteer', () => {
  it('devuelve a approved a un suspendido y le avisa', async () => {
    const repo = new InMemoryVolunteerRepository([
      makeVolunteer({ status: 'suspended', rejectionReason: 'Canceló tres recolecciones.' }),
    ]);
    const { reactivate, notifier } = setup(repo);

    await expect(reactivate.execute(admin, VOLUNTEER_ID)).resolves.toEqual({ status: 'approved' });

    const volunteer = await repo.findById(VOLUNTEER_ID);
    expect(volunteer?.status).toBe('approved');
    // El motivo de la suspensión ya no describe su situación.
    expect(volunteer?.rejectionReason).toBeNull();
    expect(notifier.sent[0].notification.title).toContain('activo otra vez');
  });

  it('no reactiva a quien no está suspendido', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'approved' })]);
    const { reactivate } = setup(repo);
    await expect(reactivate.execute(admin, VOLUNTEER_ID)).rejects.toBeInstanceOf(ConflictError);
  });

  // Mismo motivo que al aprobar: sin cobertura no se le podría asignar nada.
  it('no reactiva a quien se quedó sin municipios', async () => {
    const repo = new InMemoryVolunteerRepository([
      makeVolunteer({ status: 'suspended', municipalityIds: [] }),
    ]);
    const { reactivate } = setup(repo);
    await expect(reactivate.execute(admin, VOLUNTEER_ID)).rejects.toBeInstanceOf(ConflictError);
  });

  it('solo admins, y sin notificar si no lo es', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'suspended' })]);
    const { reactivate, notifier } = setup(repo);
    await expect(reactivate.execute(stranger, VOLUNTEER_ID)).rejects.toBeInstanceOf(ForbiddenError);
    expect(notifier.sent).toHaveLength(0);
  });
});

describe('ResubmitVolunteerApplication', () => {
  // El dueño de la solicitud del `makeVolunteer()` por omisión.
  const owner = { userId: 'volunteer-user', isAdmin: false };
  const corrected = {
    availableDays: ['tue', 'thu'] as const,
    availableFrom: '10:00:00',
    availableTo: '15:00:00',
    municipalityIds: [1, 2],
  };

  const setupResubmit = (repo: InMemoryVolunteerRepository) => {
    const notifier = new InMemoryNotifier();
    return { notifier, useCase: new ResubmitVolunteerApplication(repo, notifier) };
  };

  it('regresa la solicitud rechazada a pendiente con los datos corregidos', async () => {
    const repo = new InMemoryVolunteerRepository([
      makeVolunteer({ status: 'rejected', rejectionReason: 'Comprobante ilegible' }),
    ]);
    const { useCase } = setupResubmit(repo);

    await expect(
      useCase.execute(owner, { ...corrected, availableDays: ['tue', 'thu'] }),
    ).resolves.toEqual({ status: 'pending' });

    const volunteer = await repo.findById(VOLUNTEER_ID);
    expect(volunteer?.status).toBe('pending');
    // El motivo del rechazo anterior ya no aplica a los datos nuevos.
    expect(volunteer?.rejectionReason).toBeNull();
    expect(volunteer?.municipalityIds).toEqual([1, 2]);
  });

  it('avisa a los admins, sin avisarse a sí mismo', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'rejected' })]);
    const { useCase, notifier } = setupResubmit(repo);

    await useCase.execute(owner, { ...corrected, availableDays: ['tue'] });

    expect(notifier.sentToAdmins).toHaveLength(1);
    expect(notifier.sentToAdmins[0].notification.type).toBe('volunteer_pending_review');
    expect(notifier.sentToAdmins[0].except).toBe('volunteer-user');
  });

  it('no se reenvía una solicitud que sigue pendiente', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'pending' })]);
    const { useCase } = setupResubmit(repo);
    await expect(
      useCase.execute(owner, { ...corrected, availableDays: ['tue'] }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  // Reaplicar por cuenta propia después de una suspensión sería saltarse la decisión de BAMX.
  it('no se reenvía si está suspendido, y lo explica', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'suspended' })]);
    const { useCase } = setupResubmit(repo);
    await expect(useCase.execute(owner, { ...corrected, availableDays: ['tue'] })).rejects.toThrow(
      /suspendido/,
    );
  });

  // El permiso no se comprueba con un if: la solicitud se busca por el usuario del token.
  it('un extraño no alcanza la solicitud de otro', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'rejected' })]);
    const { useCase } = setupResubmit(repo);
    await expect(
      useCase.execute(stranger, { ...corrected, availableDays: ['tue'] }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.resubmissions).toHaveLength(0);
  });

  it('exige al menos un municipio y un día', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'rejected' })]);
    const { useCase } = setupResubmit(repo);
    await expect(
      useCase.execute(owner, { ...corrected, availableDays: ['tue'], municipalityIds: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      useCase.execute(owner, { ...corrected, availableDays: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza un horario invertido', async () => {
    const repo = new InMemoryVolunteerRepository([makeVolunteer({ status: 'rejected' })]);
    const { useCase } = setupResubmit(repo);
    await expect(
      useCase.execute(owner, {
        ...corrected,
        availableDays: ['tue'],
        availableFrom: '15:00:00',
        availableTo: '10:00:00',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
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
