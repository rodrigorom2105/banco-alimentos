import { describe, expect, it } from 'vitest';

import type { Stop } from '../../domain/assignment/route';
import type { DonationRequest, OpenDonationRequest } from '../../domain/donations/DonationRequest';
import { ConflictError, ForbiddenError } from '../../domain/shared/errors';
import type { Volunteer } from '../../domain/volunteers/Volunteer';
import {
  DOWNTOWN,
  InMemoryCampaignRepository,
  InMemoryDonationRequestRepository,
  InMemoryNotifier,
  InMemoryPickupRepository,
  InMemoryVolunteerRepository,
  PICKUP_ID,
  REQUEST_ID,
  VOLUNTEER_ID,
  fixedClock,
  makeDonationRequest,
  makeVolunteer,
  type FakeDestination,
  type FakePickup,
} from '../../test-support/inMemory';
import type { Actor } from '../ports';
import { AcceptPickup, DeclinePickup } from '../pickups/respondToPickupOffer';
import { AutoAssignPickup, ListUnassignedDonationRequests } from './autoAssignPickup';

const DONOR: Actor = { userId: 'donor', isAdmin: false };
const ADMIN: Actor = { userId: 'admin', isAdmin: true };
const STRANGER: Actor = { userId: 'otro', isAdmin: false };

const LIMITS = { maxPickupsPerDay: 5, maxRouteKm: 25, maxPickupsPerMonth: 15 };
const OFFER_HOURS = 12;
const TODAY = '2026-10-27';

const CENTER: FakeDestination = {
  id: 'centro-gdl',
  name: 'Centro BAMX Guadalajara',
  municipalityId: 1,
  coordinates: { latitude: 20.7, longitude: -103.344 },
};

// Un voluntario aprobado que cubre el municipio 1 los lunes y miércoles de 9 a 13.
const approved = (overrides: Partial<Volunteer> = {}) =>
  makeVolunteer({ status: 'approved', ...overrides });

const fakeStop = (): Stop => ({
  id: 'stop',
  coordinates: DOWNTOWN,
  destination: CENTER.coordinates,
  timeFrom: '10:00:00',
});

const offeredPickup = (overrides: Partial<FakePickup> = {}): FakePickup => ({
  id: PICKUP_ID,
  requestId: REQUEST_ID,
  volunteerId: VOLUNTEER_ID,
  destinationCampaignId: CENTER.id,
  status: 'assigned',
  assignedAt: '2026-10-27T08:00:00.000Z',
  acceptedAt: null,
  preferredDate: '2026-10-28',
  stop: fakeStop(),
  ...overrides,
});

function setup(
  options: {
    volunteers?: Volunteer[];
    pickups?: FakePickup[];
    requests?: DonationRequest[];
    open?: OpenDonationRequest[];
    destinations?: FakeDestination[];
  } = {},
) {
  const volunteers = new InMemoryVolunteerRepository(options.volunteers ?? [approved()]);
  const pickups = new InMemoryPickupRepository(options.pickups ?? []);
  const requests = new InMemoryDonationRequestRepository(
    options.requests ?? [makeDonationRequest()],
    options.open ?? [],
  );
  const campaigns = new InMemoryCampaignRepository([], options.destinations ?? [CENTER]);
  const notifier = new InMemoryNotifier();
  const clock = fixedClock(TODAY);

  const autoAssign = new AutoAssignPickup(
    requests,
    pickups,
    volunteers,
    campaigns,
    notifier,
    clock,
    LIMITS,
    OFFER_HOURS,
  );

  return {
    autoAssign,
    listUnassigned: new ListUnassignedDonationRequests(requests, clock, OFFER_HOURS),
    acceptPickup: new AcceptPickup(pickups, volunteers, requests, notifier),
    declinePickup: new DeclinePickup(pickups, volunteers, autoAssign),
    pickups,
    notifier,
  };
}

describe('AutoAssignPickup', () => {
  it('asigna la solicitud y le propone la recolección al voluntario', async () => {
    const { autoAssign, pickups, notifier } = setup();

    const result = await autoAssign.execute(DONOR, REQUEST_ID);

    expect(result).toMatchObject({ assigned: true, volunteerName: 'Ana Ramírez' });
    expect(pickups.created).toEqual([
      { requestId: REQUEST_ID, volunteerId: VOLUNTEER_ID, destinationCampaignId: CENTER.id },
    ]);
    expect(notifier.sent).toHaveLength(1);
    expect(notifier.sent[0]).toMatchObject({
      userId: 'volunteer-user',
      notification: { type: 'pickup_assigned' },
    });
  });

  // El donador no se entera todavía: una propuesta sin aceptar no es un compromiso, y decirle
  // "ya tienes voluntario" para después quitárselo sería peor que no decirle nada.
  it('no avisa al donador hasta que el voluntario acepta', async () => {
    const { autoAssign, notifier } = setup();
    await autoAssign.execute(DONOR, REQUEST_ID);
    expect(notifier.sent.map((s) => s.userId)).not.toContain('donor');
  });

  it('solo el donador o un admin pueden asignar', async () => {
    const { autoAssign } = setup();
    await expect(autoAssign.execute(STRANGER, REQUEST_ID)).rejects.toThrow(ForbiddenError);
    await expect(autoAssign.execute(ADMIN, REQUEST_ID)).resolves.toMatchObject({ assigned: true });
  });

  it('avisa a los admins cuando ningún voluntario puede tomarla', async () => {
    // Disponible solo los martes: la solicitud es de un miércoles.
    const { autoAssign, pickups, notifier } = setup({
      volunteers: [approved({ availableDays: ['tue'] })],
    });

    const result = await autoAssign.execute(DONOR, REQUEST_ID);

    expect(result).toEqual({ assigned: false, reason: 'no_candidate' });
    expect(pickups.created).toEqual([]);
    expect(notifier.sentToAdmins).toHaveLength(1);
    expect(notifier.sentToAdmins[0].notification.type).toBe('donation_unassigned');
  });

  it('no vuelve a ofrecerla a quien ya la rechazó', async () => {
    const { autoAssign, pickups } = setup({
      volunteers: [approved(), approved({ id: 'v2', userId: 'u2' })],
      pickups: [offeredPickup({ status: 'cancelled' })],
    });

    await autoAssign.execute(DONOR, REQUEST_ID);

    expect(pickups.created[0].volunteerId).toBe('v2');
  });

  it('no reasigna mientras la propuesta siga vigente', async () => {
    const { autoAssign } = setup({
      // Propuesta de hace 4 horas: el plazo es de 12.
      pickups: [offeredPickup({ assignedAt: '2026-10-27T08:00:00.000Z' })],
      requests: [makeDonationRequest({ status: 'assigned' })],
    });

    await expect(autoAssign.execute(ADMIN, REQUEST_ID)).rejects.toThrow(/esperando su respuesta/);
  });

  it('no reasigna una recolección ya confirmada', async () => {
    const { autoAssign } = setup({
      pickups: [offeredPickup({ acceptedAt: '2026-10-27T09:00:00.000Z' })],
      requests: [makeDonationRequest({ status: 'assigned' })],
    });

    await expect(autoAssign.execute(ADMIN, REQUEST_ID)).rejects.toThrow(/voluntario confirmado/);
  });

  it('libera la propuesta vencida y se la ofrece a otro voluntario', async () => {
    const { autoAssign, pickups } = setup({
      volunteers: [approved(), approved({ id: 'v2', userId: 'u2' })],
      // Propuesta de hace dos días, sin responder.
      pickups: [offeredPickup({ assignedAt: '2026-10-25T08:00:00.000Z' })],
      requests: [makeDonationRequest({ status: 'assigned' })],
    });

    const result = await autoAssign.execute(ADMIN, REQUEST_ID);

    expect(result).toMatchObject({ assigned: true });
    expect(pickups.cancellations).toEqual([
      { id: PICKUP_ID, reason: expect.stringContaining('venció') },
    ]);
    // Y no se le vuelve a ofrecer a quien la dejó vencer.
    expect(pickups.created[0].volunteerId).toBe('v2');
  });

  it('rechaza una solicitud cancelada o ya entregada', async () => {
    for (const status of ['cancelled', 'completed'] as const) {
      const { autoAssign } = setup({ requests: [makeDonationRequest({ status })] });
      await expect(autoAssign.execute(DONOR, REQUEST_ID)).rejects.toThrow(ConflictError);
    }
  });

  it('falla claro si el municipio no tiene punto de acopio activo', async () => {
    const { autoAssign } = setup({ destinations: [] });
    await expect(autoAssign.execute(DONOR, REQUEST_ID)).rejects.toThrow(/punto de acopio activo/);
  });
});

describe('ListUnassignedDonationRequests', () => {
  const open = (overrides: Partial<OpenDonationRequest>): OpenDonationRequest => ({
    ...makeDonationRequest(),
    donorName: 'Luis Pérez',
    address: 'Calle 1',
    itemsCount: 2,
    createdAt: '2026-10-26T10:00:00.000Z',
    offer: null,
    ...overrides,
  });

  const vigente = {
    pickupId: PICKUP_ID,
    volunteerId: VOLUNTEER_ID,
    volunteerName: 'Ana Ramírez',
    status: 'assigned' as const,
    assignedAt: '2026-10-27T08:00:00.000Z',
    acceptedAt: null,
  };

  it('solo la ve un admin', async () => {
    const { listUnassigned } = setup();
    await expect(listUnassigned.execute(DONOR)).rejects.toThrow(ForbiddenError);
  });

  it('muestra las que nadie tomó y las de propuesta vencida, no las vigentes', async () => {
    const { listUnassigned } = setup({
      open: [
        open({ id: 'sin-voluntario' }),
        open({ id: 'vigente', status: 'assigned', offer: vigente }),
        open({
          id: 'vencida',
          status: 'assigned',
          offer: { ...vigente, assignedAt: '2026-10-25T08:00:00.000Z' },
        }),
        open({
          id: 'confirmada',
          status: 'assigned',
          offer: { ...vigente, acceptedAt: '2026-10-27T09:00:00.000Z' },
        }),
      ],
    });

    const result = await listUnassigned.execute(ADMIN);

    expect(result.map((r) => r.id)).toEqual(['sin-voluntario', 'vencida']);
  });
});

describe('AcceptPickup', () => {
  const VOLUNTEER: Actor = { userId: 'volunteer-user', isAdmin: false };

  it('registra la aceptación y avisa al donador quién va a pasar', async () => {
    const { acceptPickup, pickups, notifier } = setup({ pickups: [offeredPickup()] });

    await acceptPickup.execute(VOLUNTEER, PICKUP_ID);

    expect(pickups.accepted).toEqual([PICKUP_ID]);
    expect(notifier.sent).toEqual([
      {
        userId: 'donor',
        notification: expect.objectContaining({
          type: 'pickup_assigned',
          body: expect.stringContaining('Ana Ramírez'),
          data: { requestId: REQUEST_ID },
        }),
      },
    ]);
  });

  it('un voluntario no puede aceptar la propuesta de otro', async () => {
    const { acceptPickup } = setup({
      volunteers: [approved(), approved({ id: 'v2', userId: 'u2' })],
      pickups: [offeredPickup({ volunteerId: 'v2' })],
    });

    await expect(acceptPickup.execute(VOLUNTEER, PICKUP_ID)).rejects.toThrow(ForbiddenError);
  });
});

describe('DeclinePickup', () => {
  const VOLUNTEER: Actor = { userId: 'volunteer-user', isAdmin: false };

  it('cancela la propuesta y la reasigna excluyendo a quien rechazó', async () => {
    const { declinePickup, pickups } = setup({
      volunteers: [approved(), approved({ id: 'v2', userId: 'u2' })],
      pickups: [offeredPickup()],
      requests: [makeDonationRequest({ status: 'assigned' })],
    });

    const result = await declinePickup.execute(VOLUNTEER, PICKUP_ID, 'Me queda muy lejos');

    expect(result).toEqual({ declined: true, reassigned: true });
    expect(pickups.cancellations).toEqual([{ id: PICKUP_ID, reason: 'Me queda muy lejos' }]);
    expect(pickups.created[0].volunteerId).toBe('v2');
  });

  // Rechazar ya quedó guardado: si no hay nadie más, el voluntario no tiene por qué recibir un
  // error. La solicitud vuelve a `pending` y el admin la ve en el panel.
  it('rechazar funciona aunque no haya a quién reasignar', async () => {
    const { declinePickup, notifier } = setup({
      pickups: [offeredPickup()],
      requests: [makeDonationRequest({ status: 'assigned' })],
    });

    const result = await declinePickup.execute(VOLUNTEER, PICKUP_ID, 'No puedo');

    expect(result).toEqual({ declined: true, reassigned: false });
    expect(notifier.sentToAdmins[0].notification.type).toBe('donation_unassigned');
  });
});
