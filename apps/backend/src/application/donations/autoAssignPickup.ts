import {
  chooseDestination,
  pickVolunteer,
  type AssignmentContext,
  type AssignmentLimits,
  type VolunteerCandidate,
} from '../../domain/assignment/assignment';
import type { CampaignRepository } from '../../domain/campaigns/CampaignRepository';
import type { DonationRequest } from '../../domain/donations/DonationRequest';
import type { DonationRequestRepository } from '../../domain/donations/DonationRequestRepository';
import { donationUnassigned, pickupOffered } from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';
import { isOfferExpired } from '../../domain/pickups/Pickup';
import type { PickupRepository } from '../../domain/pickups/PickupRepository';
import { ConflictError, ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import type { VolunteerRepository } from '../../domain/volunteers/VolunteerRepository';
import type { Actor, Clock } from '../ports';

export type AssignmentResult =
  | { assigned: true; pickupId: string; volunteerName: string }
  | { assigned: false; reason: 'no_candidate' };

/**
 * Asigna una solicitud de donación al mejor voluntario disponible y se la propone.
 *
 * Tiene que pasar por el backend por dos razones. Una, de permisos: la app no puede crear una
 * recolección a nombre de otra persona (RLS y el trigger `pickups_before_insert` lo impiden), y
 * aquí sí, porque usa la llave secreta. La otra, de información: para elegir al mejor voluntario
 * hay que ver la carga de TODOS, y ningún usuario de la app puede leer eso.
 *
 * Que el backend se salte RLS obliga a comprobar los permisos a mano: lo hace `execute`.
 */
export class AutoAssignPickup {
  constructor(
    private readonly requests: DonationRequestRepository,
    private readonly pickups: PickupRepository,
    private readonly volunteers: VolunteerRepository,
    private readonly campaigns: CampaignRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly limits: AssignmentLimits,
    private readonly offerHours: number,
  ) {}

  /**
   * Lo llama la app: el donador justo después de crear su solicitud, o un admin desde el panel
   * cuando una se quedó sin voluntario.
   */
  async execute(actor: Actor, requestId: string): Promise<AssignmentResult> {
    const request = await this.findOrFail(requestId);
    if (!actor.isAdmin && actor.userId !== request.donorId) {
      throw new ForbiddenError('Solo puedes asignar un voluntario a tus propias donaciones.');
    }
    return this.assign(request, []);
  }

  /**
   * Lo llama otro caso de uso, no una persona: cuando un voluntario rechaza la propuesta, la
   * donación se le ofrece a alguien más. No hay permisos que revisar porque no hay nadie
   * pidiéndolo; la decisión ya la tomó el sistema.
   */
  async executeAsSystem(
    requestId: string,
    excludeVolunteerIds: string[] = [],
  ): Promise<AssignmentResult> {
    const request = await this.findOrFail(requestId);
    return this.assign(request, excludeVolunteerIds);
  }

  private async findOrFail(requestId: string) {
    const request = await this.requests.findById(requestId);
    if (!request) throw new NotFoundError('La solicitud de donación no existe.');
    return request;
  }

  private async assign(
    request: DonationRequest,
    excludeVolunteerIds: string[],
  ): Promise<AssignmentResult> {
    if (request.status === 'cancelled' || request.status === 'completed') {
      throw new ConflictError(
        request.status === 'cancelled'
          ? 'Esta solicitud está cancelada.'
          : 'Esta solicitud ya se entregó.',
      );
    }

    const excluded = [
      ...excludeVolunteerIds,
      // Quien ya la rechazó o canceló antes no se vuelve a considerar: si no pudo entonces,
      // ofrecérsela otra vez solo retrasa la donación.
      ...(await this.pickups.listDeclinedVolunteerIds(request.id)),
      ...(await this.releaseExpiredOffer(request)),
    ];

    const destination = chooseDestination(
      request,
      await this.campaigns.listActiveDestinations(request.municipalityId),
    );
    const context: AssignmentContext = {
      request,
      destination,
      limits: this.limits,
      excludedVolunteerIds: excluded,
    };

    const candidates = await this.loadCandidates(request);
    const chosen = pickVolunteer(candidates, context);

    if (!chosen) {
      // La solicitud se queda `pending`: nadie la pierde, pero alguien de BAMX tiene que
      // enterarse, porque la plataforma sola ya no puede hacer nada más por ella.
      await this.notifier.notifyAdmins(donationUnassigned(request));
      return { assigned: false, reason: 'no_candidate' };
    }

    const pickupId = await this.pickups.create({
      requestId: request.id,
      volunteerId: chosen.id,
      destinationCampaignId: destination.id,
    });

    await this.notifier.notify(
      chosen.userId,
      pickupOffered({ id: pickupId }, request, this.offerHours),
    );
    // Al donador no se le avisa todavía: nadie se ha comprometido. Su aviso sale cuando el
    // voluntario acepta (`AcceptPickup`).
    return { assigned: true, pickupId, volunteerName: chosen.name };
  }

  /**
   * Si la solicitud tiene una propuesta viva, decide si se puede reasignar.
   *
   * Devuelve al voluntario que la dejó vencer, para que no se le vuelva a ofrecer la misma.
   */
  private async releaseExpiredOffer(request: DonationRequest): Promise<string[]> {
    const active = await this.pickups.findActiveByRequest(request.id);
    if (!active) return [];

    const expired = isOfferExpired(
      { ...active, preferredDate: request.preferredDate },
      { now: this.clock.now(), today: this.clock.today(), offerHours: this.offerHours },
    );
    if (!expired) {
      throw new ConflictError(
        active.acceptedAt
          ? 'Esta donación ya tiene un voluntario confirmado.'
          : 'Ya se le propuso a un voluntario; estamos esperando su respuesta.',
      );
    }

    // Cancelar la propuesta vencida devuelve la solicitud a `pending` (lo hace el trigger
    // `pickups_sync_request`), que es lo que libera el índice único y permite crear la nueva.
    await this.pickups.saveCancellation(
      active.id,
      'La propuesta venció sin respuesta del voluntario.',
    );
    return [active.volunteerId];
  }

  // Junta a los voluntarios del municipio con su carga de ese día y de ese mes.
  private async loadCandidates(request: DonationRequest): Promise<VolunteerCandidate[]> {
    const volunteers = await this.volunteers.listApprovedByMunicipality(request.municipalityId);
    if (volunteers.length === 0) return [];

    const ids = volunteers.map((v) => v.id);
    const [stops, monthly] = await Promise.all([
      this.pickups.listStopsByVolunteer(ids, request.preferredDate),
      this.pickups.countByVolunteerInMonth(ids, request.preferredDate.slice(0, 7)),
    ]);

    return volunteers.map((volunteer) => ({
      id: volunteer.id,
      userId: volunteer.userId,
      name: `${volunteer.firstName} ${volunteer.lastName}`.trim(),
      status: volunteer.status,
      municipalityIds: volunteer.municipalityIds,
      availableDays: volunteer.availableDays,
      availableFrom: volunteer.availableFrom,
      availableTo: volunteer.availableTo,
      stopsOnDate: stops[volunteer.id] ?? [],
      pickupsInMonth: monthly[volunteer.id] ?? 0,
    }));
  }
}

/**
 * Lo que el admin ve en "Donaciones sin voluntario": las que nadie tomó y las que llevan una
 * propuesta vencida sin respuesta. El plazo lo aplica el dominio, no la consulta.
 */
export class ListUnassignedDonationRequests {
  constructor(
    private readonly requests: DonationRequestRepository,
    private readonly clock: Clock,
    private readonly offerHours: number,
  ) {}

  async execute(actor: Actor) {
    if (!actor.isAdmin) {
      throw new ForbiddenError('Solo el personal de BAMX puede ver las donaciones sin asignar.');
    }

    const options = {
      now: this.clock.now(),
      today: this.clock.today(),
      offerHours: this.offerHours,
    };

    return (await this.requests.listOpenForAssignment()).filter((request) => {
      if (!request.offer) return request.status === 'pending';
      return isOfferExpired({ ...request.offer, preferredDate: request.preferredDate }, options);
    });
  }
}
