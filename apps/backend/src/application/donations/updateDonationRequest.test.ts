import { describe, expect, it } from 'vitest';

import {
  editDetails,
  requiresReassignment,
  type DonationRequestEdit,
} from '../../domain/donations/DonationRequest';
import { ForbiddenError, ValidationError } from '../../domain/shared/errors';
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
import { AutoAssignPickup } from './autoAssignPickup';
import { UpdateDonationRequest } from './updateDonationRequest';

const DONOR: Actor = { userId: 'donor', isAdmin: false };
const STRANGER: Actor = { userId: 'otro', isAdmin: false };
const ADMIN: Actor = { userId: 'admin', isAdmin: true };
const TODAY = '2026-10-27';

const CENTER: FakeDestination = {
  id: 'centro-gdl',
  name: 'Centro BAMX Guadalajara',
  municipalityId: 1,
  coordinates: { latitude: 20.7, longitude: -103.344 },
};

// Los mismos datos de `makeDonationRequest`, en forma de edición.
const baseEdit = (overrides: Partial<DonationRequestEdit> = {}): DonationRequestEdit => ({
  address: 'Av. Vallarta 1234',
  addressReferences: null,
  municipalityId: 1,
  latitude: DOWNTOWN.latitude,
  longitude: DOWNTOWN.longitude,
  preferredDate: '2026-10-28',
  preferredTimeFrom: '10:00:00',
  preferredTimeTo: '12:00:00',
  notes: null,
  preferredCampaignId: null,
  ...overrides,
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
  stop: {
    id: 'stop',
    coordinates: DOWNTOWN,
    destination: CENTER.coordinates,
    timeFrom: '10:00:00',
  },
  ...overrides,
});

function setup(options: { pickups?: FakePickup[]; volunteers?: Volunteer[] } = {}) {
  const requests = new InMemoryDonationRequestRepository([makeDonationRequest()]);
  const pickups = new InMemoryPickupRepository(options.pickups ?? []);
  const volunteers = new InMemoryVolunteerRepository(
    options.volunteers ?? [makeVolunteer({ status: 'approved' })],
  );
  const campaigns = new InMemoryCampaignRepository([], [CENTER]);
  const notifier = new InMemoryNotifier();
  const clock = fixedClock(TODAY);

  const autoAssign = new AutoAssignPickup(
    requests,
    pickups,
    volunteers,
    campaigns,
    notifier,
    clock,
    { maxPickupsPerDay: 5, maxRouteKm: 25, maxPickupsPerMonth: 15 },
    12,
  );

  return {
    update: new UpdateDonationRequest(requests, pickups, volunteers, notifier, autoAssign, clock),
    requests,
    pickups,
    notifier,
  };
}

describe('editDetails', () => {
  it('recorta los textos y deja en null los vacíos', () => {
    const edit = editDetails(
      baseEdit({ address: '  Av. Vallarta 1234  ', notes: '   ', addressReferences: ' Portón ' }),
      TODAY,
    );
    expect(edit.address).toBe('Av. Vallarta 1234');
    expect(edit.notes).toBeNull();
    expect(edit.addressReferences).toBe('Portón');
  });

  it('rechaza una fecha en el pasado', () => {
    expect(() => editDetails(baseEdit({ preferredDate: '2026-10-26' }), TODAY)).toThrow(
      ValidationError,
    );
  });

  // El mismo día sí: la recolección puede ser hoy más tarde.
  it('acepta la fecha de hoy', () => {
    expect(() => editDetails(baseEdit({ preferredDate: TODAY }), TODAY)).not.toThrow();
  });

  it('rechaza un horario invertido o de duración cero', () => {
    const invertido = baseEdit({ preferredTimeFrom: '14:00:00', preferredTimeTo: '12:00:00' });
    const igual = baseEdit({ preferredTimeFrom: '12:00:00', preferredTimeTo: '12:00:00' });
    expect(() => editDetails(invertido, TODAY)).toThrow(/posterior/);
    expect(() => editDetails(igual, TODAY)).toThrow(/posterior/);
  });

  it('rechaza dirección vacía y coordenadas fuera de rango', () => {
    expect(() => editDetails(baseEdit({ address: '   ' }), TODAY)).toThrow(/dirección/);
    expect(() => editDetails(baseEdit({ latitude: 91 }), TODAY)).toThrow(/latitud/);
    expect(() => editDetails(baseEdit({ longitude: -181 }), TODAY)).toThrow(/longitud/);
  });
});

describe('requiresReassignment', () => {
  const current = makeDonationRequest();

  it('no reasigna si solo cambian referencias, notas o el texto del domicilio', () => {
    const edit = baseEdit({
      address: 'Av. Vallarta 1234, int. 5',
      addressReferences: 'Portón azul',
      notes: 'Toca el timbre dos veces',
    });
    expect(requiresReassignment(current, edit)).toBe(false);
  });

  it('reasigna si cambia el día, el horario, el municipio o las coordenadas', () => {
    expect(requiresReassignment(current, baseEdit({ preferredDate: '2026-10-30' }))).toBe(true);
    expect(requiresReassignment(current, baseEdit({ preferredTimeFrom: '08:00:00' }))).toBe(true);
    expect(requiresReassignment(current, baseEdit({ preferredTimeTo: '18:00:00' }))).toBe(true);
    expect(requiresReassignment(current, baseEdit({ municipalityId: 2 }))).toBe(true);
    expect(requiresReassignment(current, baseEdit({ latitude: 20.75 }))).toBe(true);
  });
});

describe('UpdateDonationRequest', () => {
  it('guarda los cambios de una solicitud que nadie tomó', async () => {
    const { update, requests } = setup();

    const result = await update.execute(DONOR, REQUEST_ID, baseEdit({ notes: 'Timbre azul' }));

    expect(result).toEqual({ updated: true, reassigned: false });
    expect(requests.edits).toHaveLength(1);
    expect(requests.edits[0].edit.notes).toBe('Timbre azul');
  });

  it('solo el dueño puede editarla, ni siquiera un admin', async () => {
    const { update } = setup();
    await expect(update.execute(STRANGER, REQUEST_ID, baseEdit())).rejects.toThrow(ForbiddenError);
    await expect(update.execute(ADMIN, REQUEST_ID, baseEdit())).rejects.toThrow(ForbiddenError);
  });

  // Alguien ya organizó su día alrededor de esa hora.
  it('no deja editar si el voluntario ya confirmó', async () => {
    const { update } = setup({
      pickups: [offeredPickup({ acceptedAt: '2026-10-27T09:00:00.000Z' })],
    });
    await expect(
      update.execute(DONOR, REQUEST_ID, baseEdit({ preferredDate: '2026-10-30' })),
    ).rejects.toThrow(/ya confirmó/);
  });

  it('conserva la propuesta si el cambio no afecta la decisión', async () => {
    const { update, pickups, notifier } = setup({ pickups: [offeredPickup()] });

    const result = await update.execute(DONOR, REQUEST_ID, baseEdit({ notes: 'Portón azul' }));

    expect(result).toEqual({ updated: true, reassigned: false });
    expect(pickups.cancellations).toEqual([]);
    expect(notifier.sent).toEqual([]);
  });

  it('retira la propuesta y reasigna si cambia la fecha, avisando al voluntario', async () => {
    const { update, pickups, notifier } = setup({ pickups: [offeredPickup()] });

    // Jueves 29; el voluntario de prueba está disponible lunes y miércoles, así que ya no
    // califica y la solicitud se queda sin nadie.
    const result = await update.execute(
      DONOR,
      REQUEST_ID,
      baseEdit({ preferredDate: '2026-10-29' }),
    );

    expect(result).toEqual({ updated: true, reassigned: false });
    expect(pickups.cancellations).toEqual([
      { id: PICKUP_ID, reason: expect.stringContaining('cambió la fecha') },
    ]);
    expect(notifier.sent).toEqual([
      {
        userId: 'volunteer-user',
        notification: expect.objectContaining({ type: 'pickup_cancelled' }),
      },
    ]);
  });

  /**
   * El caso que justifica la opción `allow` de la asignación.
   *
   * Al reprogramar se cancela la propuesta, y una recolección cancelada normalmente significa
   * "este voluntario dijo que no". Aquí nunca dijo nada: se la quitó el sistema. Si el horario
   * nuevo le sigue quedando, tiene que poder recibirla otra vez.
   */
  it('se la vuelve a proponer al mismo voluntario si el horario nuevo le queda', async () => {
    const { update, pickups } = setup({ pickups: [offeredPickup()] });

    // Sigue siendo miércoles 28, solo se mueve la ventana dentro de su horario (9 a 13).
    const result = await update.execute(
      DONOR,
      REQUEST_ID,
      baseEdit({ preferredTimeFrom: '11:00:00', preferredTimeTo: '12:30:00' }),
    );

    expect(result).toEqual({ updated: true, reassigned: true });
    expect(pickups.created).toEqual([
      { requestId: REQUEST_ID, volunteerId: VOLUNTEER_ID, destinationCampaignId: CENTER.id },
    ]);
  });
});
