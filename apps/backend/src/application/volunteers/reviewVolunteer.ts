import {
  volunteerApproved,
  volunteerReactivated,
  volunteerRejected,
  volunteerSuspended,
} from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import { ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import {
  approve,
  reactivate,
  reject,
  suspend,
  type VolunteerStatus,
} from '../../domain/volunteers/Volunteer';
import type { VolunteerRepository } from '../../domain/volunteers/VolunteerRepository';
import type { Actor } from '../ports';

function assertAdmin(actor: Actor) {
  if (!actor.isAdmin) {
    throw new ForbiddenError('Solo el personal de BAMX puede revisar voluntarios.');
  }
}

async function findOrFail(volunteers: VolunteerRepository, id: string) {
  const volunteer = await volunteers.findById(id);
  if (!volunteer) throw new NotFoundError('La solicitud de voluntariado no existe.');
  return volunteer;
}

export class ListVolunteersForReview {
  constructor(private readonly volunteers: VolunteerRepository) {}

  async execute(actor: Actor, status: VolunteerStatus | null) {
    assertAdmin(actor);
    return this.volunteers.listByStatus(status);
  }
}

export class ApproveVolunteer {
  constructor(
    private readonly volunteers: VolunteerRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, volunteerId: string) {
    assertAdmin(actor);
    const volunteer = await findOrFail(this.volunteers, volunteerId);
    const review = approve(volunteer, actor.userId);
    await this.volunteers.saveReview(volunteerId, review);
    // El aviso va después de guardar: nunca se notifica algo que no pasó.
    await this.notifier.notify(volunteer.userId, volunteerApproved());
    return { status: review.status };
  }
}

export class RejectVolunteer {
  constructor(
    private readonly volunteers: VolunteerRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, volunteerId: string, reason: string) {
    assertAdmin(actor);
    const volunteer = await findOrFail(this.volunteers, volunteerId);
    const review = reject(volunteer, actor.userId, reason);
    await this.volunteers.saveReview(volunteerId, review);
    await this.notifier.notify(
      volunteer.userId,
      volunteerRejected(review.rejectionReason ?? reason),
    );
    return { status: review.status };
  }
}

export class ReactivateVolunteer {
  constructor(
    private readonly volunteers: VolunteerRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, volunteerId: string) {
    assertAdmin(actor);
    const volunteer = await findOrFail(this.volunteers, volunteerId);
    const review = reactivate(volunteer, actor.userId);
    await this.volunteers.saveReview(volunteerId, review);
    await this.notifier.notify(volunteer.userId, volunteerReactivated());
    return { status: review.status };
  }
}

export class SuspendVolunteer {
  constructor(
    private readonly volunteers: VolunteerRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(actor: Actor, volunteerId: string, reason: string) {
    assertAdmin(actor);
    const volunteer = await findOrFail(this.volunteers, volunteerId);
    const review = suspend(volunteer, actor.userId, reason);
    await this.volunteers.saveReview(volunteerId, review);
    await this.notifier.notify(
      volunteer.userId,
      volunteerSuspended(review.rejectionReason ?? reason),
    );
    return { status: review.status };
  }
}
