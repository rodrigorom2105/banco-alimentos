import { describe, expect, it } from 'vitest';

import { ConflictError, ForbiddenError } from '../../domain/shared/errors';
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
import { AutoAssignPickup } from '../donations/autoAssignPickup';
import type { Actor } from '../ports';
import {
  CancelPickup,
  CollectPickup,
  DeliverPickup,
  GetMyPickupSummary,
  GetMyRoute,
  StartPickup,
} from './runPickup';

const VOLUNTEER: Actor = { userId: 'volunteer-user', isAdmin: false };
const OTHER: Actor = { userId: 'u2', isAdmin: false };
const TODAY = '2026-10-28';

const CENTER: FakeDestination = {
  id: 'centro-gdl',
  name: 'Centro BAMX Guadalajara',
  municipalityId: 1,
  coordinates: { latitude: 20.7, longitude: -103.344 },
};

const ITEMS = [
  {
    id: 'item-1',
    description: 'Atún en agua',
    quantity: 10,
    unit: 'piece',
    collectedQuantity: null,
  },
];

// Una recolección ya confirmada por el voluntario de prueba.
const pickup = (overrides: Partial<FakePickup> = {}): FakePickup => ({
  id: PICKUP_ID,
  requestId: REQUEST_ID,
  volunteerId: VOLUNTEER_ID,
  destinationCampaignId: CENTER.id,
  status: 'assigned',
  assignedAt: '2026-10-27T08:00:00.000Z',
  acceptedAt: '2026-10-27T09:00:00.000Z',
  preferredDate: TODAY,
  stop: {
    id: 'stop',
    coordinates: DOWNTOWN,
    destination: CENTER.coordinates,
    timeFrom: '10:00:00',
  },
  items: ITEMS.map((item) => ({ ...item })),
  ...overrides,
});

function setup(pickups: FakePickup[] = [pickup()]) {
  const requests = new InMemoryDonationRequestRepository([
    makeDonationRequest({ status: 'assigned' }),
  ]);
  const repo = new InMemoryPickupRepository(pickups);
  const volunteers = new InMemoryVolunteerRepository([
    makeVolunteer({ status: 'approved' }),
    makeVolunteer({ id: 'v2', userId: 'u2', status: 'approved' }),
  ]);
  const notifier = new InMemoryNotifier();
  const clock = fixedClock(TODAY);

  const autoAssign = new AutoAssignPickup(
    requests,
    repo,
    volunteers,
    new InMemoryCampaignRepository([], [CENTER]),
    notifier,
    clock,
    { maxPickupsPerDay: 5, maxRouteKm: 25, maxPickupsPerMonth: 15 },
    12,
  );

  return {
    start: new StartPickup(repo, volunteers, requests, notifier),
    collect: new CollectPickup(repo, volunteers),
    deliver: new DeliverPickup(repo, volunteers, requests, notifier),
    cancel: new CancelPickup(repo, volunteers, requests, notifier, autoAssign),
    route: new GetMyRoute(repo, volunteers),
    summary: new GetMyPickupSummary(repo, volunteers, clock),
    pickups: repo,
    notifier,
  };
}

describe('StartPickup', () => {
  it('avisa al donador que su voluntario va en camino', async () => {
    const { start, notifier } = setup();

    expect(await start.execute(VOLUNTEER, PICKUP_ID)).toEqual({ status: 'on_the_way' });
    // Con `requestId` en `data`: sin esa llave la app mandaría al donador al panel de
    // voluntario, donde no tiene nada que hacer.
    expect(notifier.sent).toEqual([
      {
        userId: 'donor',
        notification: expect.objectContaining({
          type: 'pickup_on_the_way',
          title: expect.stringContaining('Ana Ramírez'),
          data: { requestId: REQUEST_ID },
        }),
      },
    ]);
  });

  it('un voluntario no puede mover la recolección de otro', async () => {
    const { start } = setup();
    await expect(start.execute(OTHER, PICKUP_ID)).rejects.toThrow(ForbiddenError);
  });
});

describe('CollectPickup', () => {
  it('guarda las cantidades reales y la deja recolectada', async () => {
    const { collect, pickups } = setup([pickup({ status: 'on_the_way' })]);

    const result = await collect.execute(VOLUNTEER, PICKUP_ID, [
      { itemId: 'item-1', collectedQuantity: 8 },
    ]);

    expect(result).toEqual({ status: 'collected' });
    expect(pickups.collections).toEqual([
      { id: PICKUP_ID, items: [{ itemId: 'item-1', collectedQuantity: 8 }] },
    ]);
  });

  // El donador acaba de entregar el donativo en su puerta: no hace falta avisarle nada.
  it('no manda avisos', async () => {
    const { collect, notifier } = setup([pickup({ status: 'on_the_way' })]);
    await collect.execute(VOLUNTEER, PICKUP_ID, [{ itemId: 'item-1', collectedQuantity: 8 }]);
    expect(notifier.sent).toEqual([]);
  });
});

describe('DeliverPickup', () => {
  it('guarda la foto y avisa al donador que su donativo llegó', async () => {
    const { deliver, pickups, notifier } = setup([pickup({ status: 'collected' })]);

    const result = await deliver.execute(VOLUNTEER, PICKUP_ID, 'volunteer-user/pickup-1.jpg');

    expect(result).toEqual({ status: 'delivered' });
    expect(pickups.deliveries).toEqual([
      { id: PICKUP_ID, evidencePhotoPath: 'volunteer-user/pickup-1.jpg' },
    ]);
    expect(notifier.sent[0].notification.type).toBe('pickup_delivered');
  });

  it('sin foto no entrega', async () => {
    const { deliver, pickups } = setup([pickup({ status: 'collected' })]);
    await expect(deliver.execute(VOLUNTEER, PICKUP_ID, '   ')).rejects.toThrow(/foto/);
    expect(pickups.deliveries).toEqual([]);
  });
});

describe('CancelPickup', () => {
  it('avisa al donador y reasigna a otro voluntario', async () => {
    const { cancel, pickups, notifier } = setup();

    const result = await cancel.execute(VOLUNTEER, PICKUP_ID, 'Se me averió el carro');

    expect(result).toEqual({ cancelled: true, reassigned: true });
    expect(pickups.cancellations).toEqual([{ id: PICKUP_ID, reason: 'Se me averió el carro' }]);
    // A diferencia de rechazar una propuesta, aquí el donador ya contaba con que alguien iba.
    expect(notifier.sent.some((s) => s.notification.type === 'pickup_cancelled')).toBe(true);
    // Y no se le vuelve a ofrecer a quien canceló.
    expect(pickups.created[0].volunteerId).toBe('v2');
  });

  it('no deja cancelar una que ya se recolectó', async () => {
    const { cancel } = setup([pickup({ status: 'collected' })]);
    await expect(cancel.execute(VOLUNTEER, PICKUP_ID, 'Ya no puedo')).rejects.toThrow(
      ConflictError,
    );
  });
});

describe('GetMyRoute', () => {
  const second = pickup({
    id: 'pickup-2',
    requestId: 'request-2',
    status: 'on_the_way',
    // Más lejos del centro, y más tarde en el día.
    stop: {
      id: 'stop-2',
      coordinates: { latitude: 20.9, longitude: -103.344 },
      destination: CENTER.coordinates,
      timeFrom: '16:00:00',
    },
  });

  it('ordena las paradas y arma el enlace de Google Maps', async () => {
    const { route } = setup([pickup(), second]);

    const result = await route.execute(VOLUNTEER, TODAY, null);

    expect(result.stops.map((s) => s.id)).toEqual([PICKUP_ID, 'pickup-2']);
    expect(result.mapsUrl).toContain('waypoints=');
    expect(result.mapsUrl).toContain('destination=20.7,-103.344');
  });

  it('con ubicación arranca por la parada más cercana', async () => {
    const { route } = setup([pickup(), second]);
    const from = { latitude: 20.9, longitude: -103.344 };

    const result = await route.execute(VOLUNTEER, TODAY, from);

    expect(result.stops.map((s) => s.id)).toEqual(['pickup-2', PICKUP_ID]);
    expect(result.mapsUrl).toContain('origin=20.9,-103.344');
  });

  // Una propuesta sin confirmar todavía no es parte de su día.
  it('ignora las recolecciones sin confirmar y los otros días', async () => {
    const { route } = setup([
      pickup({ acceptedAt: null }),
      pickup({ id: 'otro-dia', preferredDate: '2026-10-30' }),
    ]);

    const result = await route.execute(VOLUNTEER, TODAY, null);

    expect(result.stops).toEqual([]);
    expect(result.mapsUrl).toBeNull();
  });
});

describe('GetMyPickupSummary', () => {
  it('cuenta las activas y las entregadas del mes', async () => {
    const { summary } = setup([
      pickup(),
      pickup({ id: 'entregada', status: 'delivered' }),
      pickup({ id: 'mes-pasado', status: 'delivered', preferredDate: '2026-09-15' }),
      pickup({ id: 'cancelada', status: 'cancelled' }),
    ]);

    expect(await summary.execute(VOLUNTEER)).toEqual({ active: 1, deliveredThisMonth: 1 });
  });
});
