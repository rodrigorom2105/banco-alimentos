import { volunteerPendingReview } from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import { NotFoundError } from '../../domain/shared/errors';
import { fullName, resubmit, type VolunteerResubmission } from '../../domain/volunteers/Volunteer';
import type { VolunteerRepository } from '../../domain/volunteers/VolunteerRepository';
import type { Actor } from '../ports';

/**
 * Volver a enviar la solicitud propia después de un rechazo.
 *
 * A diferencia del resto de los casos de uso de voluntarios, este NO es de admin: lo llama el
 * dueño de la solicitud. No hace falta comprobar permisos con un `if`, porque la solicitud se
 * busca **por el usuario del actor**: nadie puede alcanzar la de otra persona.
 *
 * Tiene que pasar por el backend porque la base prohíbe que un usuario cambie su propio
 * `validation_status` (02_rules.sql), que es justo lo que evita que alguien se autoapruebe.
 */
export class ResubmitVolunteerApplication {
  constructor(
    private readonly volunteers: VolunteerRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, data: VolunteerResubmission) {
    const volunteer = await this.volunteers.findByUserId(actor.userId);
    if (!volunteer) throw new NotFoundError('No tienes una solicitud de voluntariado.');

    const corrected = resubmit(volunteer, data);
    await this.volunteers.saveResubmission(volunteer.id, corrected);

    // Los admins se enteran igual que con una solicitud nueva: el trigger de la base solo
    // cubre los INSERT, y esto es un UPDATE.
    await this.notifier.notifyAdmins(
      volunteerPendingReview(volunteer.id, fullName(volunteer)),
      actor.userId,
    );
    return { status: 'pending' as const };
  }
}
