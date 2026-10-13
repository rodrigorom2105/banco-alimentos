import { supportDelivered, supportResponded } from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import { ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import { markDelivered, respond, type SupportStatus } from '../../domain/support/SupportRequest';
import type { SupportRequestRepository } from '../../domain/support/SupportRequestRepository';
import type { Actor } from '../ports';

function assertAdmin(actor: Actor) {
  if (!actor.isAdmin) {
    throw new ForbiddenError('Solo el personal de BAMX puede responder solicitudes de apoyo.');
  }
}

async function findOrFail(requests: SupportRequestRepository, id: string) {
  const request = await requests.findById(id);
  if (!request) throw new NotFoundError('La solicitud de apoyo no existe.');
  return request;
}

export class ListSupportRequestsForReview {
  constructor(private readonly requests: SupportRequestRepository) {}

  async execute(actor: Actor, status: SupportStatus | null) {
    assertAdmin(actor);
    return this.requests.listByStatus(status);
  }
}

export class RespondSupportRequest {
  constructor(
    private readonly requests: SupportRequestRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, requestId: string, approved: boolean, message: string) {
    assertAdmin(actor);
    const request = await findOrFail(this.requests, requestId);
    const response = respond(request, actor.userId, approved, message);
    await this.requests.saveResponse(requestId, response);

    // Se avisa a quien la pidió, no al organizador actual de la campaña.
    await this.notifier.notify(
      request.requestedBy,
      supportResponded(
        { id: request.id, campaignId: request.campaignId },
        approved,
        response.responseMessage,
      ),
    );
    return { status: response.status };
  }
}

export class DeliverSupportRequest {
  constructor(
    private readonly requests: SupportRequestRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, requestId: string) {
    assertAdmin(actor);
    const request = await findOrFail(this.requests, requestId);
    const response = markDelivered(request, actor.userId);
    await this.requests.saveResponse(requestId, response);
    await this.notifier.notify(
      request.requestedBy,
      supportDelivered({ id: request.id, campaignId: request.campaignId }),
    );
    return { status: response.status };
  }
}
