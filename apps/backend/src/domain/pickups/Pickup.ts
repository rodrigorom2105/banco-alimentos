import { ConflictError, ForbiddenError, ValidationError } from '../shared/errors';

export type PickupStatus = 'assigned' | 'on_the_way' | 'collected' | 'delivered' | 'cancelled';

/**
 * Una recolección: la plataforma le propone a un voluntario pasar por el donativo de alguien.
 *
 * `assignedAt` es cuándo se le propuso y `acceptedAt` cuándo la aceptó. Mientras `acceptedAt`
 * sea null es una propuesta sin responder (09_pickup_acceptance.sql): nadie se comprometió
 * todavía, así que el donador no debe pensar que su donativo ya tiene dueño.
 */
export type Pickup = {
  id: string;
  requestId: string;
  volunteerId: string;
  destinationCampaignId: string;
  status: PickupStatus;
  assignedAt: string; // ISO
  acceptedAt: string | null;
};

export type NewPickup = {
  requestId: string;
  volunteerId: string;
  destinationCampaignId: string;
};

// Lo mínimo para saber si una propuesta ya venció. Se separa de `Pickup` porque la lista del
// panel de administrador trae estos datos de una solicitud, no una entidad completa.
export type PickupOffer = {
  assignedAt: string;
  acceptedAt: string | null;
  status: PickupStatus;
  // Fecha de la recolección, tomada de la solicitud.
  preferredDate: string; // 'YYYY-MM-DD'
};

const HOUR_MS = 60 * 60 * 1000;

/**
 * ¿La propuesta se quedó sin respuesta demasiado tiempo?
 *
 * Manda el reloj: `offerHours` horas desde que se propuso. Hay un segundo caso, que es cuando
 * el día de la recolección ya pasó: ahí la propuesta sobra aunque el plazo no se haya agotado,
 * porque ya no hay nada que recoger. Al revés no se recorta nunca —una propuesta hecha dos
 * horas antes de la recolección conserva sus horas completas—, para que el voluntario siempre
 * tenga tiempo real de contestar.
 */
export function isOfferExpired(
  offer: PickupOffer,
  options: { now: Date; today: string; offerHours: number },
): boolean {
  if (offer.status !== 'assigned' || offer.acceptedAt !== null) return false;

  const deadline = new Date(offer.assignedAt).getTime() + options.offerHours * HOUR_MS;
  if (options.now.getTime() > deadline) return true;

  return offer.preferredDate < options.today;
}

function assertOwner(pickup: Pickup, volunteerId: string) {
  if (pickup.volunteerId !== volunteerId) {
    throw new ForbiddenError('Esta recolección está asignada a otro voluntario.');
  }
}

/**
 * Aceptar la propuesta. Solo el voluntario al que se le ofreció, solo una vez y solo mientras
 * siga siendo una propuesta: si ya la canceló o ya va en camino no hay nada que aceptar.
 */
export function accept(pickup: Pickup, volunteerId: string): void {
  assertOwner(pickup, volunteerId);
  if (pickup.status !== 'assigned') {
    throw new ConflictError(
      pickup.status === 'cancelled'
        ? 'Esta recolección ya se canceló.'
        : `Esta recolección ya está en curso (estado actual: ${pickup.status}).`,
    );
  }
  if (pickup.acceptedAt !== null) {
    throw new ConflictError('Ya habías aceptado esta recolección.');
  }
}

/**
 * Rechazar la propuesta, con motivo.
 *
 * Solo aplica a una propuesta sin aceptar. Desistir de una recolección ya aceptada es otra
 * cosa (cancelarla, Fase 9): ahí el donador ya contaba con que alguien iba a pasar, así que el
 * aviso y el momento en que se puede hacer son distintos.
 *
 * Para la base rechazar es cancelar, y el trigger `pickups_sync_request` devuelve la solicitud
 * a `pending` sola; el caso de uso la vuelve a asignar excluyendo a esta persona.
 */
export function decline(pickup: Pickup, volunteerId: string, reason: string): string {
  assertOwner(pickup, volunteerId);
  if (pickup.status !== 'assigned') {
    throw new ConflictError(
      pickup.status === 'cancelled'
        ? 'Esta recolección ya se canceló.'
        : `Esta recolección ya está en curso (estado actual: ${pickup.status}).`,
    );
  }
  if (pickup.acceptedAt !== null) {
    throw new ConflictError(
      'Ya aceptaste esta recolección. Si no puedes hacerla, cancélala para que se le asigne a otro voluntario.',
    );
  }
  const trimmed = reason.trim();
  if (!trimmed) throw new ValidationError('El motivo para rechazar es obligatorio.');
  return trimmed;
}
