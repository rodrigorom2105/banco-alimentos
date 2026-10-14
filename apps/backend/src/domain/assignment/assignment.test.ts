import { describe, expect, it } from 'vitest';

import { DOWNTOWN, makeDonationRequest } from '../../test-support/inMemory';
import { ConflictError } from '../shared/errors';
import {
  addedKm,
  chooseDestination,
  isCandidate,
  overlaps,
  pickVolunteer,
  weekdayOf,
  type AssignmentContext,
  type DestinationCampaign,
  type VolunteerCandidate,
} from './assignment';
import { haversineKm } from './geo';
import {
  buildGoogleMapsUrl,
  estimatedRouteKm,
  orderByNearest,
  orderDay,
  STREET_FACTOR,
  type Stop,
} from './route';

// Punto de acopio ~3 km al norte del domicilio del donador.
const CENTER: DestinationCampaign = {
  id: 'centro-gdl',
  name: 'Centro BAMX Guadalajara',
  coordinates: { latitude: 20.7, longitude: -103.344 },
};

const stop = (id: string, latitude: number, longitude: number, timeFrom = '10:00:00'): Stop => ({
  id,
  coordinates: { latitude, longitude },
  destination: CENTER.coordinates,
  timeFrom,
});

const makeCandidate = (overrides: Partial<VolunteerCandidate> = {}): VolunteerCandidate => ({
  id: 'v1',
  userId: 'u1',
  name: 'Ana Ramírez',
  status: 'approved',
  municipalityIds: [1],
  availableDays: ['mon', 'wed'],
  availableFrom: '09:00:00',
  availableTo: '13:00:00',
  stopsOnDate: [],
  pickupsInMonth: 0,
  ...overrides,
});

const makeContext = (overrides: Partial<AssignmentContext> = {}): AssignmentContext => ({
  request: makeDonationRequest(),
  destination: CENTER,
  limits: { maxPickupsPerDay: 5, maxRouteKm: 25, maxPickupsPerMonth: 15 },
  excludedVolunteerIds: [],
  ...overrides,
});

describe('haversineKm', () => {
  it('mide un grado de latitud en el ecuador', () => {
    // Un grado de latitud son ~111.19 km en cualquier parte del planeta.
    const km = haversineKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(km).toBeCloseTo(111.19, 1);
  });

  // Un grado de longitud se acorta al alejarse del ecuador: a 60° de latitud mide la mitad.
  it('mide un grado de longitud según la latitud', () => {
    const atEquator = haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    const atSixty = haversineKm({ latitude: 60, longitude: 0 }, { latitude: 60, longitude: 1 });
    expect(atEquator).toBeCloseTo(111.19, 1);
    expect(atSixty).toBeCloseTo(atEquator / 2, 0);
  });

  it('da cero en el mismo punto y lo mismo en los dos sentidos', () => {
    expect(haversineKm(DOWNTOWN, DOWNTOWN)).toBe(0);
    expect(haversineKm(DOWNTOWN, CENTER.coordinates)).toBeCloseTo(
      haversineKm(CENTER.coordinates, DOWNTOWN),
      10,
    );
  });
});

describe('weekdayOf', () => {
  it('traduce la fecha al día de la semana', () => {
    expect(weekdayOf('2026-10-28')).toBe('wed');
    expect(weekdayOf('2026-10-25')).toBe('sun');
  });
});

describe('overlaps', () => {
  it('acepta cualquier traslape, aunque sea de un minuto', () => {
    expect(overlaps('09:00:00', '13:00:00', '12:59:00', '18:00:00')).toBe(true);
  });

  // Ventanas que solo se tocan en el extremo no sirven: nadie recoge nada en cero minutos.
  it('rechaza ventanas que solo se tocan o no se cruzan', () => {
    expect(overlaps('09:00:00', '12:00:00', '12:00:00', '18:00:00')).toBe(false);
    expect(overlaps('09:00:00', '13:00:00', '14:00:00', '18:00:00')).toBe(false);
  });

  it('compara bien un HH:MM contra un HH:MM:SS', () => {
    expect(overlaps('09:00', '13:00', '10:00:00', '11:00:00')).toBe(true);
  });
});

describe('estimatedRouteKm', () => {
  it('es cero sin paradas', () => {
    expect(estimatedRouteKm([])).toBe(0);
  });

  // Con una sola parada el día es solo el tramo domicilio → punto de acopio.
  it('con una parada cuenta el tramo al punto de acopio', () => {
    const only = stop('a', DOWNTOWN.latitude, DOWNTOWN.longitude);
    const expected = haversineKm(DOWNTOWN, CENTER.coordinates) * STREET_FACTOR;
    expect(estimatedRouteKm([only])).toBeCloseTo(expected, 6);
  });

  it('no depende del orden en que lleguen las paradas', () => {
    const stops = [
      stop('a', 20.67, -103.34, '09:00:00'),
      stop('b', 20.68, -103.35, '11:00:00'),
      stop('c', 20.69, -103.36, '13:00:00'),
    ];
    expect(estimatedRouteKm(stops)).toBeCloseTo(estimatedRouteKm([...stops].reverse()), 10);
  });
});

describe('orderByNearest', () => {
  it('visita siempre la parada más próxima de las que faltan', () => {
    const far = stop('far', 20.9, -103.344);
    const near = stop('near', 20.68, -103.344);
    const middle = stop('middle', 20.75, -103.344);
    const ordered = orderByNearest([far, middle, near], DOWNTOWN);
    expect(ordered.map((s) => s.id)).toEqual(['near', 'middle', 'far']);
  });
});

describe('orderDay', () => {
  const temprano = stop('temprano', 20.9, -103.344, '08:00:00');
  const tarde = stop('tarde', 20.68, -103.344, '16:00:00');

  // Sin ubicación del voluntario, el horario del donador es la única referencia que hay: los
  // voluntarios no tienen coordenadas de su casa registradas.
  it('sin punto de partida empieza por la parada más temprana', () => {
    expect(orderDay([tarde, temprano], null).map((s) => s.id)).toEqual(['temprano', 'tarde']);
  });

  it('con punto de partida empieza por la más cercana, sin importar el horario', () => {
    const from = { latitude: 20.68, longitude: -103.344 };
    expect(orderDay([temprano, tarde], from).map((s) => s.id)).toEqual(['tarde', 'temprano']);
  });

  it('con el día vacío no devuelve nada', () => {
    expect(orderDay([], null)).toEqual([]);
  });
});

describe('buildGoogleMapsUrl', () => {
  const a = { latitude: 20.67, longitude: -103.34 };
  const b = { latitude: 20.68, longitude: -103.35 };
  const centro = { latitude: 20.7, longitude: -103.344 };

  // Las comas y la barra vertical tienen que ir literales: escapadas, Maps no las entiende.
  it('arma la URL con las paradas intermedias separadas por |', () => {
    const url = buildGoogleMapsUrl(a, [a, b], centro);
    expect(url).toContain('origin=20.67,-103.34');
    expect(url).toContain('destination=20.7,-103.344');
    expect(url).toContain('waypoints=20.67,-103.34|20.68,-103.35');
    expect(url).toContain('travelmode=driving');
  });

  // Sin origen, Maps arranca donde esté el celular: justo lo que se quiere si no dio permiso.
  it('omite el origen si no hay ubicación', () => {
    expect(buildGoogleMapsUrl(null, [a], centro)).not.toContain('origin=');
  });

  it('funciona sin paradas intermedias', () => {
    expect(buildGoogleMapsUrl(a, [], centro)).not.toContain('waypoints=');
  });
});

describe('isCandidate', () => {
  it('acepta a un voluntario que cumple todo', () => {
    expect(isCandidate(makeCandidate(), makeContext())).toBe(true);
  });

  it('rechaza a quien no está aprobado', () => {
    for (const status of ['pending', 'rejected', 'suspended'] as const) {
      expect(isCandidate(makeCandidate({ status }), makeContext())).toBe(false);
    }
  });

  it('rechaza a quien no cubre el municipio', () => {
    expect(isCandidate(makeCandidate({ municipalityIds: [2, 3] }), makeContext())).toBe(false);
  });

  it('rechaza a quien no está disponible ese día', () => {
    // 2026-10-27 es martes y el voluntario solo tiene lunes y miércoles.
    const context = makeContext({ request: makeDonationRequest({ preferredDate: '2026-10-27' }) });
    expect(isCandidate(makeCandidate(), context)).toBe(false);
  });

  it('rechaza a quien tiene horario sin traslape', () => {
    const volunteer = makeCandidate({ availableFrom: '14:00:00', availableTo: '18:00:00' });
    expect(isCandidate(volunteer, makeContext())).toBe(false);
  });

  // Que el voluntario recoja su propio donativo no aportaría nada: lo llevaría él mismo.
  it('rechaza al donador de la propia solicitud', () => {
    expect(isCandidate(makeCandidate({ userId: 'donor' }), makeContext())).toBe(false);
  });

  it('rechaza a quien ya rechazó esta solicitud', () => {
    expect(isCandidate(makeCandidate(), makeContext({ excludedVolunteerIds: ['v1'] }))).toBe(false);
  });

  it('respeta el tope de recolecciones del día', () => {
    const limits = { maxPickupsPerDay: 2, maxRouteKm: 25, maxPickupsPerMonth: 15 };
    const one = makeCandidate({ stopsOnDate: [stop('a', 20.674, -103.345)] });
    const two = makeCandidate({
      stopsOnDate: [stop('a', 20.674, -103.345), stop('b', 20.675, -103.346)],
    });
    expect(isCandidate(one, makeContext({ limits }))).toBe(true);
    expect(isCandidate(two, makeContext({ limits }))).toBe(false);
  });

  it('respeta el tope de recolecciones del mes', () => {
    const limits = { maxPickupsPerDay: 5, maxRouteKm: 25, maxPickupsPerMonth: 3 };
    expect(isCandidate(makeCandidate({ pickupsInMonth: 2 }), makeContext({ limits }))).toBe(true);
    expect(isCandidate(makeCandidate({ pickupsInMonth: 3 }), makeContext({ limits }))).toBe(false);
  });

  it('respeta el tope de kilómetros de la ruta del día', () => {
    // La ruta mínima (domicilio → punto de acopio) ya pasa de 1 km.
    const limits = { maxPickupsPerDay: 5, maxRouteKm: 1, maxPickupsPerMonth: 15 };
    expect(isCandidate(makeCandidate(), makeContext({ limits }))).toBe(false);
  });
});

describe('pickVolunteer', () => {
  it('devuelve null si nadie califica', () => {
    expect(pickVolunteer([], makeContext())).toBeNull();
    expect(pickVolunteer([makeCandidate({ status: 'suspended' })], makeContext())).toBeNull();
  });

  it('elige al que menos kilómetros agrega, aunque lleve más recolecciones', () => {
    const context = makeContext();
    // El día de `cerca` ya pasa por el mismo domicilio, así que la parada nueva casi no le
    // cuesta; `libre` tendría que hacer el viaje completo.
    const cerca = makeCandidate({
      id: 'cerca',
      stopsOnDate: [stop('ya', DOWNTOWN.latitude, DOWNTOWN.longitude)],
      pickupsInMonth: 8,
    });
    const libre = makeCandidate({ id: 'libre', pickupsInMonth: 0 });

    expect(addedKm(cerca, context)).toBeLessThan(addedKm(libre, context));
    expect(pickVolunteer([libre, cerca], context)?.id).toBe('cerca');
  });

  it('con los mismos kilómetros gana quien lleva menos recolecciones en el mes', () => {
    const cargado = makeCandidate({ id: 'a-cargado', pickupsInMonth: 5 });
    const libre = makeCandidate({ id: 'b-libre', pickupsInMonth: 1 });
    expect(pickVolunteer([cargado, libre], makeContext())?.id).toBe('b-libre');
  });

  // El último desempate no es justicia, es reproducibilidad: sin él, dos ejecuciones iguales
  // podrían elegir a personas distintas y ningún test podría afirmar nada.
  it('con todo empatado gana el id menor, siempre', () => {
    const b = makeCandidate({ id: 'v-b' });
    const a = makeCandidate({ id: 'v-a' });
    expect(pickVolunteer([b, a], makeContext())?.id).toBe('v-a');
    expect(pickVolunteer([a, b], makeContext())?.id).toBe('v-a');
  });
});

describe('chooseDestination', () => {
  const lejos: DestinationCampaign = {
    id: 'lejos',
    name: 'Campaña lejana',
    coordinates: { latitude: 20.9, longitude: -103.344 },
  };

  it('respeta la campaña que eligió el donador si sigue activa', () => {
    const request = makeDonationRequest({ preferredCampaignId: 'lejos' });
    expect(chooseDestination(request, [CENTER, lejos]).id).toBe('lejos');
  });

  // Si la campaña que eligió ya no está activa no viene en la lista, y el donativo tiene que
  // ir a algún lado: la más cercana es la que menos traslado le cuesta al voluntario.
  it('si la que eligió ya no está activa usa la más cercana', () => {
    const request = makeDonationRequest({ preferredCampaignId: 'finalizada' });
    expect(chooseDestination(request, [lejos, CENTER]).id).toBe('centro-gdl');
  });

  it('sin campaña elegida usa la más cercana', () => {
    expect(chooseDestination(makeDonationRequest(), [lejos, CENTER]).id).toBe('centro-gdl');
  });

  it('con la misma distancia elige el id menor', () => {
    const a = { ...CENTER, id: 'a' };
    const b = { ...CENTER, id: 'b' };
    expect(chooseDestination(makeDonationRequest(), [b, a]).id).toBe('a');
  });

  it('sin puntos de acopio activos falla con un mensaje claro', () => {
    expect(() => chooseDestination(makeDonationRequest(), [])).toThrow(ConflictError);
    expect(() => chooseDestination(makeDonationRequest(), [])).toThrow(/punto de acopio activo/);
  });
});
