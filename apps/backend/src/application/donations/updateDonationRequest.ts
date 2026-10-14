import {
  editDetails,
  requiresReassignment,
  type DonationRequestEdit,
} from '../../domain/donations/DonationRequest';
import type { DonationRequestRepository } from '../../domain/donations/DonationRequestRepository';
import { pickupWithdrawn } from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import type { PickupRepository } from '../../domain/pickups/PickupRepository';
import { ConflictError, ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import type { VolunteerRepository } from '../../domain/volunteers/VolunteerRepository';
import type { Actor, Clock } from '../ports';
import type { AutoAssignPickup } from './autoAssignPickup';

/**
 * El donador corrige su solicitud: domicilio, día, horario, notas o punto de acopio.
 *
 * Tiene que pasar por el backend. El trigger `donation_requests_before_write` solo deja editar
 * mientras la solicitud esté `pending`, y en cuanto la plataforma le propone la recolección a
 * alguien pasa a `assigned`. Como el plazo para confirmar es de 12 horas, sin esto el donador
 * perdería la posibilidad de corregir casi de inmediato, aunque nadie se hubiera comprometido
 * todavía.
 *
 * Qué pasa con la propuesta en curso depende de QUÉ cambió:
 *  - nada relevante (referencias, notas): se queda igual;
 *  - el día, el horario o dónde se recoge: se retira y se vuelve a asignar, porque son los
 *    datos con los que se eligió a ese voluntario;
 *  - si ya la confirmó: no se deja editar. Alguien organizó su día alrededor de esa hora.
 */
export class UpdateDonationRequest {
  constructor(
    private readonly requests: DonationRequestRepository,
    private readonly pickups: PickupRepository,
    // Para traducir el id del voluntario al del usuario, que es a quien se le notifica.
    private readonly volunteers: VolunteerRepository,
    private readonly notifier: Notifier,
    private readonly autoAssign: AutoAssignPickup,
    private readonly clock: Clock,
  ) {}

  async execute(actor: Actor, requestId: string, input: DonationRequestEdit) {
    const request = await this.requests.findById(requestId);
    if (!request) throw new NotFoundError('La solicitud de donación no existe.');

    // Solo el dueño. Un admin no edita el domicilio ni el horario de alguien más: si hay un
    // problema con los datos, quien los corrige es quien los dio.
    if (actor.userId !== request.donorId) {
      throw new ForbiddenError('Solo puedes editar tus propias donaciones.');
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      throw new ConflictError(
        request.status === 'cancelled'
          ? 'Esta solicitud está cancelada.'
          : 'Esta solicitud ya se entregó.',
      );
    }

    const edit = editDetails(input, this.clock.today());
    const offer = await this.pickups.findActiveByRequest(requestId);

    if (offer?.acceptedAt) {
      throw new ConflictError(
        'Tu voluntario ya confirmó esta recolección, así que no se puede cambiar la fecha ni el horario. Si no te funciona, cancela la solicitud y crea una nueva.',
      );
    }

    const mustReassign = !!offer && requiresReassignment(request, edit);
    if (mustReassign) {
      await this.pickups.saveCancellation(
        offer.id,
        'Quien dona cambió la fecha o el horario de la recolección.',
      );
    }

    await this.requests.saveDetails(requestId, edit);

    if (!mustReassign) return { updated: true as const, reassigned: false };

    // Al voluntario se le avisa que la propuesta que tenía ya no aplica; sin esto vería
    // desaparecer una recolección sin explicación. `notify` recibe el id del USUARIO, no el de
    // la solicitud de voluntariado, que es otro.
    const volunteer = await this.volunteers.findById(offer.volunteerId);
    if (volunteer) await this.notifier.notify(volunteer.userId, pickupWithdrawn());

    // `allow` con el mismo voluntario: la propuesta se la retiró el sistema, no la rechazó él,
    // así que si los datos nuevos le siguen quedando es el mejor candidato otra vez.
    const result = await this.autoAssign.executeAsSystem(requestId, {
      allow: [offer.volunteerId],
    });
    return { updated: true as const, reassigned: result.assigned };
  }
}
