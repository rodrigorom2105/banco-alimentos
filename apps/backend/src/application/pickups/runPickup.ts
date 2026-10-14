import type { Coordinates } from '../../domain/assignment/geo';
import { buildGoogleMapsUrl, orderDay, type Stop } from '../../domain/assignment/route';
import type { DonationRequestRepository } from '../../domain/donations/DonationRequestRepository';
import {
  pickupCancelledByVolunteer,
  pickupDelivered,
  pickupOnTheWay,
} from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import { cancel, collect, deliver, start, type CollectedItem } from '../../domain/pickups/Pickup';
import type { PickupRepository, VolunteerPickup } from '../../domain/pickups/PickupRepository';
import { NotFoundError } from '../../domain/shared/errors';
import { fullName } from '../../domain/volunteers/Volunteer';
import type { VolunteerRepository } from '../../domain/volunteers/VolunteerRepository';
import type { AutoAssignPickup } from '../donations/autoAssignPickup';
import type { Actor, Clock } from '../ports';

/**
 * Busca la solicitud de voluntariado del actor y la recolección que dice.
 *
 * El voluntario se resuelve por el usuario del token, nunca por un id que venga en la petición:
 * así nadie puede operar la recolección de otra persona. Que sea suya lo comprueban las reglas
 * del dominio, porque es una regla de negocio y no un detalle de esta capa.
 */
async function findMine(
  volunteers: VolunteerRepository,
  pickups: PickupRepository,
  actor: Actor,
  pickupId: string,
) {
  const volunteer = await volunteers.findByUserId(actor.userId);
  if (!volunteer) throw new NotFoundError('No tienes una solicitud de voluntariado.');

  const pickup = await pickups.findById(pickupId);
  if (!pickup) throw new NotFoundError('La recolección no existe.');

  return { volunteer, pickup };
}

// El donador recibe los avisos, así que hay que llegar de la recolección a su dueño.
const donorOf = (requests: DonationRequestRepository, requestId: string) =>
  requests.findById(requestId).then((request) => request?.donorId ?? null);

export class StartPickup {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
    private readonly requests: DonationRequestRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, pickupId: string) {
    const { volunteer, pickup } = await findMine(this.volunteers, this.pickups, actor, pickupId);
    start(pickup, volunteer.id);
    await this.pickups.saveStart(pickup.id);

    // Es el aviso más útil de todo el flujo: le dice al donador que tenga el donativo a mano.
    const donorId = await donorOf(this.requests, pickup.requestId);
    if (donorId) {
      await this.notifier.notify(donorId, pickupOnTheWay(pickup.requestId, fullName(volunteer)));
    }
    return { status: 'on_the_way' as const };
  }
}

export class CollectPickup {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
  ) {}

  async execute(actor: Actor, pickupId: string, items: CollectedItem[]) {
    const { volunteer, pickup } = await findMine(this.volunteers, this.pickups, actor, pickupId);
    const collected = collect(pickup, volunteer.id, items);
    await this.pickups.saveCollection(pickup.id, collected);

    // Sin aviso al donador: acaba de entregar el donativo en la puerta de su casa, ya lo sabe.
    return { status: 'collected' as const };
  }
}

export class DeliverPickup {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
    private readonly requests: DonationRequestRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, pickupId: string, evidencePhotoPath: string) {
    const { volunteer, pickup } = await findMine(this.volunteers, this.pickups, actor, pickupId);
    const path = deliver(pickup, volunteer.id, evidencePhotoPath);
    // El trigger `pickups_sync_request` deja la solicitud en `completed` al guardar esto.
    await this.pickups.saveDelivery(pickup.id, path);

    const donorId = await donorOf(this.requests, pickup.requestId);
    if (donorId) await this.notifier.notify(donorId, pickupDelivered(pickup.requestId));

    return { status: 'delivered' as const };
  }
}

/**
 * El voluntario desiste de una recolección que ya había confirmado.
 *
 * A diferencia de rechazar una propuesta, aquí el donador ya contaba con que alguien iba a
 * pasar: por eso se le avisa. La donación se vuelve a asignar excluyendo a quien canceló.
 */
export class CancelPickup {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
    private readonly requests: DonationRequestRepository,
    private readonly notifier: Notifier,
    private readonly autoAssign: AutoAssignPickup,
  ) {}

  async execute(actor: Actor, pickupId: string, reason: string) {
    const { volunteer, pickup } = await findMine(this.volunteers, this.pickups, actor, pickupId);
    const motive = cancel(pickup, volunteer.id, reason);
    await this.pickups.saveCancellation(pickup.id, motive);

    const donorId = await donorOf(this.requests, pickup.requestId);
    if (donorId) {
      await this.notifier.notify(donorId, pickupCancelledByVolunteer(pickup.requestId));
    }

    // Cancelar ya quedó guardado; reasignar es un intento aparte. Si falla, el voluntario no
    // tiene por qué cargar con ese error: la solicitud vuelve a `pending` y el admin la ve.
    try {
      const result = await this.autoAssign.executeAsSystem(pickup.requestId, {
        exclude: [volunteer.id],
      });
      return { cancelled: true as const, reassigned: result.assigned };
    } catch (error) {
      console.error('No se pudo reasignar la solicitud %s:', pickup.requestId, error);
      return { cancelled: true as const, reassigned: false };
    }
  }
}

export type DayRoute = {
  stops: VolunteerPickup[];
  mapsUrl: string | null;
};

/**
 * La ruta del día: las paradas en orden y el enlace para abrirla en Google Maps.
 *
 * El orden lo calcula la plataforma (vecino más cercano); navegar lo hace Maps, que ya sabe del
 * tráfico. El punto de acopio va al final, que es el único destino posible: todas las campañas
 * de una ruta están en el mismo municipio (Fase 8), y en la práctica suele ser el mismo centro.
 */
export class GetMyRoute {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
  ) {}

  async execute(actor: Actor, date: string, from: Coordinates | null): Promise<DayRoute> {
    const volunteer = await this.volunteers.findByUserId(actor.userId);
    if (!volunteer) throw new NotFoundError('No tienes una solicitud de voluntariado.');

    // Solo las confirmadas: una propuesta sin responder todavía no es parte de su día.
    const today = (await this.pickups.listForVolunteer(volunteer.id)).filter(
      (p) => p.request.preferredDate === date && p.acceptedAt !== null,
    );
    if (today.length === 0) return { stops: [], mapsUrl: null };

    const byId = new Map(today.map((pickup) => [pickup.id, pickup]));
    const stops: Stop[] = today.map((pickup) => ({
      id: pickup.id,
      coordinates: pickup.request.coordinates,
      destination: pickup.destination.coordinates,
      timeFrom: pickup.request.preferredTimeFrom,
    }));

    const ordered = orderDay(stops, from);
    const last = ordered[ordered.length - 1];

    return {
      stops: ordered.map((stop) => byId.get(stop.id)!),
      mapsUrl: buildGoogleMapsUrl(
        from,
        ordered.map((stop) => stop.coordinates),
        last.destination,
      ),
    };
  }
}

/** Contadores del panel: lo que tiene pendiente y lo que ya entregó este mes. */
export class GetMyPickupSummary {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
    private readonly clock: Clock,
  ) {}

  async execute(actor: Actor) {
    const volunteer = await this.volunteers.findByUserId(actor.userId);
    if (!volunteer) throw new NotFoundError('No tienes una solicitud de voluntariado.');

    const active = await this.pickups.listForVolunteer(volunteer.id);
    return {
      active: active.length,
      deliveredThisMonth: await this.pickups.countDeliveredInMonth(
        volunteer.id,
        this.clock.today().slice(0, 7),
      ),
    };
  }
}
