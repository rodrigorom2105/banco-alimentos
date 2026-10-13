import { describe, expect, it } from 'vitest';

import { ConflictError, ForbiddenError, ValidationError } from '../../domain/shared/errors';
import {
  InMemoryNotifier,
  InMemorySupportRequestRepository,
  makeSupportRequest,
  SUPPORT_ID,
} from '../../test-support/inMemory';
import {
  DeliverSupportRequest,
  ListSupportRequestsForReview,
  RespondSupportRequest,
} from './reviewSupportRequest';

const admin = { userId: 'admin', isAdmin: true };
const organizer = { userId: 'organizer', isAdmin: false };

const setup = (repo: InMemorySupportRequestRepository) => {
  const notifier = new InMemoryNotifier();
  return {
    notifier,
    respond: new RespondSupportRequest(repo, notifier),
    deliver: new DeliverSupportRequest(repo, notifier),
  };
};

describe('RespondSupportRequest', () => {
  it('aprueba y avisa a quien la pidió', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest()]);
    const { respond, notifier } = setup(repo);

    await expect(
      respond.execute(admin, SUPPORT_ID, true, 'Te los entregamos el jueves.'),
    ).resolves.toEqual({ status: 'approved' });
    expect(notifier.sent[0].userId).toBe('organizer');
    expect(notifier.sent[0].notification.type).toBe('support_approved');
    expect(notifier.sent[0].notification.body).toContain('jueves');
  });

  it('al aprobar, el mensaje es opcional', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest()]);
    const { respond } = setup(repo);
    await expect(respond.execute(admin, SUPPORT_ID, true, '')).resolves.toEqual({
      status: 'approved',
    });
    expect(repo.responses[0].response.responseMessage).toBeNull();
  });

  // A nadie se le niega un apoyo sin explicación.
  it('al rechazar, el motivo es obligatorio', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest()]);
    const { respond, notifier } = setup(repo);
    await expect(respond.execute(admin, SUPPORT_ID, false, '   ')).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(notifier.sent).toHaveLength(0);
  });

  it('rechaza con motivo y lo manda en el aviso', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest()]);
    const { respond, notifier } = setup(repo);
    await respond.execute(admin, SUPPORT_ID, false, 'No hay contenedores disponibles.');
    expect(notifier.sent[0].notification.type).toBe('support_rejected');
    expect(notifier.sent[0].notification.body).toContain('No hay contenedores disponibles.');
  });

  it('no responde una solicitud que ya fue contestada', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest({ status: 'approved' })]);
    const { respond } = setup(repo);
    await expect(respond.execute(admin, SUPPORT_ID, true, 'Otra vez')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('solo admins', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest()]);
    const { respond } = setup(repo);
    await expect(respond.execute(organizer, SUPPORT_ID, true, '')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe('DeliverSupportRequest', () => {
  it('entrega un apoyo aprobado y avisa', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest({ status: 'approved' })]);
    const { deliver, notifier } = setup(repo);

    await expect(deliver.execute(admin, SUPPORT_ID)).resolves.toEqual({ status: 'delivered' });
    expect(notifier.sent[0].notification.type).toBe('support_delivered');
  });

  it('no entrega un apoyo que no fue aprobado', async () => {
    const repo = new InMemorySupportRequestRepository([makeSupportRequest({ status: 'pending' })]);
    const { deliver } = setup(repo);
    await expect(deliver.execute(admin, SUPPORT_ID)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('ListSupportRequestsForReview', () => {
  it('filtra por estado y es solo para admins', async () => {
    const repo = new InMemorySupportRequestRepository([
      makeSupportRequest(),
      makeSupportRequest({ id: 'otra', status: 'delivered' }),
    ]);
    const useCase = new ListSupportRequestsForReview(repo);

    expect(await useCase.execute(admin, 'pending')).toHaveLength(1);
    expect(await useCase.execute(admin, null)).toHaveLength(2);
    await expect(useCase.execute(organizer, null)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
