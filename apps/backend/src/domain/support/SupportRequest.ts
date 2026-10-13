import { ConflictError, ValidationError } from '../shared/errors';

export type SupportType = 'containers' | 'promotion' | 'material' | 'other';
export type SupportStatus = 'pending' | 'approved' | 'rejected' | 'delivered' | 'cancelled';

export type SupportRequest = {
  id: string;
  campaignId: string;
  campaignName: string;
  // Quién la pidió: es a esa persona a la que se le responde, no al organizador actual de la
  // campaña (el esquema guarda `requested_by` a propósito, como foto del momento).
  requestedBy: string;
  type: SupportType;
  description: string;
  neededBy: string | null;
  status: SupportStatus;
  responseMessage: string | null;
  createdAt: string;
};

export type SupportResponse = {
  status: SupportStatus;
  responseMessage: string | null;
  reviewedBy: string;
  reviewedAt: Date;
};

// Reglas del esquema (sección 5.8): pending → approved | rejected | cancelled;
// approved → delivered. Y si se rechaza, el mensaje de respuesta es obligatorio: a nadie se
// le niega un apoyo sin explicación.

export function respond(
  request: SupportRequest,
  reviewerId: string,
  approved: boolean,
  message: string,
): SupportResponse {
  if (request.status !== 'pending') {
    throw new ConflictError(
      `Solo se responden solicitudes pendientes (estado actual: ${request.status}).`,
    );
  }
  const trimmed = message.trim();
  if (!approved && !trimmed) {
    throw new ValidationError('Al rechazar una solicitud de apoyo hay que explicar el motivo.');
  }
  return {
    status: approved ? 'approved' : 'rejected',
    // Al aprobar el mensaje es opcional, pero si viene se guarda.
    responseMessage: trimmed || null,
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
  };
}

export function markDelivered(request: SupportRequest, reviewerId: string): SupportResponse {
  if (request.status !== 'approved') {
    throw new ConflictError(
      `Solo se entrega un apoyo aprobado (estado actual: ${request.status}).`,
    );
  }
  return {
    status: 'delivered',
    responseMessage: request.responseMessage,
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
  };
}
