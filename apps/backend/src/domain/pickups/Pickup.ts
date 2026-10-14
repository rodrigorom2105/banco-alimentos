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

// Lo que el voluntario registró de verdad al recoger, producto por producto.
export type CollectedItem = { itemId: string; collectedQuantity: number };

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

// Rechazar y cancelar piden motivo: es lo que le dice a BAMX si el problema fue la zona, el
// horario o algo del donativo, y lo que justifica no volver a ofrecerle esta solicitud.
function requireReason(reason: string, action: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new ValidationError(`El motivo para ${action} es obligatorio.`);
  return trimmed;
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
  return requireReason(reason, 'rechazar');
}

/**
 * El flujo de una recolección aceptada: assigned → on_the_way → collected → delivered.
 *
 * Cada paso solo se puede dar desde el anterior. No es burocracia: el estado es lo que ve el
 * donador ("tu voluntario va en camino") y lo que dispara que su solicitud quede completada, así
 * que saltarse uno deja a alguien mal informado o a la solicitud en un estado que no ocurrió.
 *
 * La base aplica las mismas transiciones (`pickups_before_update`). Aquí se repiten para poder
 * explicarlas en español y para que el caso de uso falle antes de intentar el update.
 */
function assertStep(pickup: Pickup, from: PickupStatus, action: string) {
  if (pickup.status === from) return;
  if (pickup.status === 'cancelled') {
    throw new ConflictError('Esta recolección se canceló.');
  }
  throw new ConflictError(
    `No puedes ${action} una recolección que está en "${pickup.status}" (tiene que estar en "${from}").`,
  );
}

// Salir hacia el domicilio del donador. Exige haberla aceptado: la base lo valida igual, y sin
// eso un voluntario podría empezar una recolección que nunca confirmó.
export function start(pickup: Pickup, volunteerId: string): void {
  assertOwner(pickup, volunteerId);
  assertStep(pickup, 'assigned', 'iniciar');
  if (pickup.acceptedAt === null) {
    throw new ConflictError('Primero confirma esta recolección.');
  }
}

/**
 * Marcar que ya se recogió el donativo, con las cantidades reales.
 *
 * Las cantidades pueden ser menores a lo que el donador declaró (o cero, si al final no tenía
 * ese producto); lo que no pueden ser es negativas. Se piden todas: un producto sin cantidad
 * sería un hueco en la trazabilidad justo donde más importa.
 */
export function collect(
  pickup: Pickup,
  volunteerId: string,
  items: CollectedItem[],
): CollectedItem[] {
  assertOwner(pickup, volunteerId);
  assertStep(pickup, 'on_the_way', 'marcar como recolectada');

  if (items.length === 0) {
    throw new ValidationError('Registra cuánto recolectaste de cada producto.');
  }
  for (const item of items) {
    if (!Number.isFinite(item.collectedQuantity) || item.collectedQuantity < 0) {
      throw new ValidationError('Las cantidades recolectadas no pueden ser negativas.');
    }
  }
  return items;
}

/**
 * Entregar en el centro de acopio, con foto.
 *
 * La foto es obligatoria por decisión de BAMX: es el comprobante de que el donativo llegó a su
 * destino. La base la exige también, y no deja reemplazarla después
 * (12_pickup_evidence_required.sql).
 */
export function deliver(pickup: Pickup, volunteerId: string, evidencePhotoPath: string): string {
  assertOwner(pickup, volunteerId);
  assertStep(pickup, 'collected', 'marcar como entregada');

  const path = evidencePhotoPath.trim();
  if (!path) {
    throw new ValidationError('Toma una foto de la entrega en el centro de acopio.');
  }
  return path;
}

/**
 * Desistir de una recolección ya aceptada, con motivo.
 *
 * Solo antes de recoger: después de `collected` el donativo ya está en manos del voluntario y
 * cancelar no lo devuelve a su casa. Es distinto de `decline`, que es para una propuesta que
 * nunca se confirmó: ahí el donador no sabía nada y aquí ya contaba con que alguien iba a pasar.
 */
export function cancel(pickup: Pickup, volunteerId: string, reason: string): string {
  assertOwner(pickup, volunteerId);
  if (pickup.status !== 'assigned' && pickup.status !== 'on_the_way') {
    throw new ConflictError(
      pickup.status === 'cancelled'
        ? 'Esta recolección ya se canceló.'
        : 'Ya recogiste el donativo, así que esta recolección no se puede cancelar. Entrégalo en el centro de acopio o comunícate con BAMX.',
    );
  }
  if (pickup.acceptedAt === null) {
    throw new ConflictError(
      'Todavía no confirmas esta recolección; recházala en lugar de cancelarla.',
    );
  }
  return requireReason(reason, 'cancelar');
}
