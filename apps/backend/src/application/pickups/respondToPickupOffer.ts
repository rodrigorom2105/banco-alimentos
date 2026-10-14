import { pickupAccepted } from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import type { DonationRequestRepository } from '../../domain/donations/DonationRequestRepository';
import { accept, decline } from '../../domain/pickups/Pickup';
import type { PickupRepository } from '../../domain/pickups/PickupRepository';
import { NotFoundError } from '../../domain/shared/errors';
import { fullName } from '../../domain/volunteers/Volunteer';
import type { VolunteerRepository } from '../../domain/volunteers/VolunteerRepository';
import type { AutoAssignPickup } from '../donations/autoAssignPickup';
import type { Actor } from '../ports';

/**
 * Busca la solicitud de voluntariado del actor y la recolección que dice.
 *
 * El voluntario se resuelve por el usuario del token, no por un id que venga en la petición:
 * así nadie puede contestar la propuesta de otra persona. La comprobación de que la recolección
 * es suya la hacen las reglas del dominio (`accept` y `decline`), porque es una regla de
 * negocio y no un detalle de esta capa.
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

export class AcceptPickup {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
    private readonly requests: DonationRequestRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, pickupId: string) {
    const { volunteer, pickup } = await findMine(this.volunteers, this.pickups, actor, pickupId);
    accept(pickup, volunteer.id);
    await this.pickups.saveAcceptance(pickup.id);

    // Primer aviso que recibe el donador sobre esta recolección: hasta ahora su solicitud solo
    // decía "buscando voluntario", porque una propuesta sin aceptar no es un compromiso.
    const request = await this.requests.findById(pickup.requestId);
    if (request) {
      await this.notifier.notify(request.donorId, pickupAccepted(request, fullName(volunteer)));
    }
    return { accepted: true as const };
  }
}

export class DeclinePickup {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
    private readonly autoAssign: AutoAssignPickup,
  ) {}

  async execute(actor: Actor, pickupId: string, reason: string) {
    const { volunteer, pickup } = await findMine(this.volunteers, this.pickups, actor, pickupId);
    const motive = decline(pickup, volunteer.id, reason);
    await this.pickups.saveCancellation(pickup.id, motive);

    // Rechazar ya quedó guardado; reasignar es un intento aparte. Si falla (por ejemplo, el
    // punto de acopio del municipio se desactivó), el voluntario no tiene por qué cargar con
    // ese error: su solicitud vuelve a `pending` y el admin la ve en el panel.
    try {
      const result = await this.autoAssign.executeAsSystem(pickup.requestId, {
        exclude: [volunteer.id],
      });
      return { declined: true as const, reassigned: result.assigned };
    } catch (error) {
      console.error('No se pudo reasignar la solicitud %s:', pickup.requestId, error);
      return { declined: true as const, reassigned: false };
    }
  }
}

/**
 * Las recolecciones del voluntario: propuestas por confirmar y las que ya aceptó.
 *
 * Pasa por el backend aunque RLS ya dejaría leer `pickups` desde la app, porque la lista
 * necesita datos de otras tablas (domicilio del donador, productos, punto de acopio) y armar
 * ese join con las políticas de cada tabla desde la app sería frágil.
 */
export class ListMyPickups {
  constructor(
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
  ) {}

  async execute(actor: Actor) {
    const volunteer = await this.volunteers.findByUserId(actor.userId);
    if (!volunteer) throw new NotFoundError('No tienes una solicitud de voluntariado.');
    return this.pickups.listForVolunteer(volunteer.id);
  }
}
