import { describe, expect, it } from 'vitest';

import { ConflictError, ForbiddenError, ValidationError } from '../shared/errors';
import {
  accept,
  cancel,
  collect,
  decline,
  deliver,
  isOfferExpired,
  start,
  type Pickup,
} from './Pickup';

const makePickup = (overrides: Partial<Pickup> = {}): Pickup => ({
  id: 'pickup-1',
  requestId: 'request-1',
  volunteerId: 'v1',
  destinationCampaignId: 'centro-gdl',
  status: 'assigned',
  assignedAt: '2026-10-27T10:00:00.000Z',
  acceptedAt: null,
  ...overrides,
});

describe('accept', () => {
  it('deja aceptar una propuesta propia sin responder', () => {
    expect(() => accept(makePickup(), 'v1')).not.toThrow();
  });

  it('no deja aceptar la propuesta de otro voluntario', () => {
    expect(() => accept(makePickup(), 'otro')).toThrow(ForbiddenError);
  });

  it('no deja aceptar dos veces', () => {
    const accepted = makePickup({ acceptedAt: '2026-10-27T11:00:00.000Z' });
    expect(() => accept(accepted, 'v1')).toThrow(/Ya habías aceptado/);
  });

  it('no deja aceptar una recolección cancelada o ya en curso', () => {
    expect(() => accept(makePickup({ status: 'cancelled' }), 'v1')).toThrow(/ya se canceló/);
    expect(() => accept(makePickup({ status: 'on_the_way', acceptedAt: null }), 'v1')).toThrow(
      /ya está en curso/,
    );
  });
});

describe('decline', () => {
  it('devuelve el motivo recortado', () => {
    expect(decline(makePickup(), 'v1', '  Me queda muy lejos  ')).toBe('Me queda muy lejos');
  });

  it('exige motivo', () => {
    expect(() => decline(makePickup(), 'v1', '   ')).toThrow(ValidationError);
  });

  it('no deja rechazar la propuesta de otro voluntario', () => {
    expect(() => decline(makePickup(), 'otro', 'No puedo')).toThrow(ForbiddenError);
  });

  // Desistir de algo ya aceptado es cancelar, que es otra cosa: ahí el donador ya contaba con
  // que alguien iba a pasar, así que el aviso y el momento permitido son distintos.
  it('no deja rechazar lo que ya se aceptó; manda a cancelar', () => {
    const accepted = makePickup({ acceptedAt: '2026-10-27T11:00:00.000Z' });
    expect(() => decline(accepted, 'v1', 'Ya no puedo')).toThrow(ConflictError);
    expect(() => decline(accepted, 'v1', 'Ya no puedo')).toThrow(/cancélala/);
  });
});

// Una recolección ya confirmada, que es el punto de partida del flujo.
const accepted = (overrides: Partial<Pickup> = {}) =>
  makePickup({ acceptedAt: '2026-10-27T11:00:00.000Z', ...overrides });

describe('start', () => {
  it('sale en camino desde una recolección confirmada', () => {
    expect(() => start(accepted(), 'v1')).not.toThrow();
  });

  // La base lo valida igual; aquí el mensaje dice qué hacer.
  it('no deja empezar una propuesta sin confirmar', () => {
    expect(() => start(makePickup(), 'v1')).toThrow(/Primero confirma/);
  });

  it('no deja empezar fuera de orden ni la de otro', () => {
    expect(() => start(accepted({ status: 'collected' }), 'v1')).toThrow(ConflictError);
    expect(() => start(accepted(), 'otro')).toThrow(ForbiddenError);
  });
});

describe('collect', () => {
  const items = [{ itemId: 'item-1', collectedQuantity: 3 }];

  it('registra las cantidades reales desde en camino', () => {
    expect(collect(accepted({ status: 'on_the_way' }), 'v1', items)).toEqual(items);
  });

  // Menos de lo declarado es normal, y cero también: el donador pudo no tener ese producto.
  it('acepta cero', () => {
    const none = [{ itemId: 'item-1', collectedQuantity: 0 }];
    expect(collect(accepted({ status: 'on_the_way' }), 'v1', none)).toEqual(none);
  });

  it('rechaza cantidades negativas y listas vacías', () => {
    const negative = [{ itemId: 'item-1', collectedQuantity: -1 }];
    expect(() => collect(accepted({ status: 'on_the_way' }), 'v1', negative)).toThrow(
      ValidationError,
    );
    expect(() => collect(accepted({ status: 'on_the_way' }), 'v1', [])).toThrow(ValidationError);
  });

  it('no deja recolectar sin haber salido en camino', () => {
    expect(() => collect(accepted(), 'v1', items)).toThrow(/tiene que estar en "on_the_way"/);
  });
});

describe('deliver', () => {
  it('entrega con foto desde recolectada', () => {
    const path = deliver(accepted({ status: 'collected' }), 'v1', '  u1/p1.jpg  ');
    expect(path).toBe('u1/p1.jpg');
  });

  // La decisión de BAMX: la evidencia se toma en el centro de acopio, y sin ella no hay entrega.
  it('no deja entregar sin foto', () => {
    expect(() => deliver(accepted({ status: 'collected' }), 'v1', '   ')).toThrow(/foto/);
  });

  it('no deja entregar sin haber recolectado', () => {
    expect(() => deliver(accepted({ status: 'on_the_way' }), 'v1', 'u1/p1.jpg')).toThrow(
      ConflictError,
    );
  });
});

describe('cancel', () => {
  it('cancela una confirmada antes de recoger, con motivo', () => {
    expect(cancel(accepted(), 'v1', '  Se me averió el carro  ')).toBe('Se me averió el carro');
    expect(cancel(accepted({ status: 'on_the_way' }), 'v1', 'No llego')).toBe('No llego');
  });

  it('exige motivo', () => {
    expect(() => cancel(accepted(), 'v1', '  ')).toThrow(ValidationError);
  });

  // Ya tiene el donativo en el carro: cancelar no lo devuelve a casa del donador.
  it('no deja cancelar después de recoger', () => {
    expect(() => cancel(accepted({ status: 'collected' }), 'v1', 'Ya no')).toThrow(
      /no se puede cancelar/,
    );
  });

  // Sin confirmar, la acción correcta es rechazar: el donador todavía no sabe nada.
  it('manda a rechazar si todavía no la confirmó', () => {
    expect(() => cancel(makePickup(), 'v1', 'No puedo')).toThrow(/recházala/);
  });
});

describe('isOfferExpired', () => {
  const offer = {
    assignedAt: '2026-10-27T10:00:00.000Z',
    acceptedAt: null,
    status: 'assigned' as const,
    preferredDate: '2026-10-30',
  };

  it('no está vencida dentro del plazo', () => {
    const now = new Date('2026-10-27T21:59:00.000Z'); // 11 h 59 min después
    expect(isOfferExpired(offer, { now, today: '2026-10-27', offerHours: 12 })).toBe(false);
  });

  it('está vencida al pasar el plazo', () => {
    const now = new Date('2026-10-27T22:01:00.000Z'); // 12 h 01 min después
    expect(isOfferExpired(offer, { now, today: '2026-10-27', offerHours: 12 })).toBe(true);
  });

  // El plazo manda: una propuesta hecha hoy para mañana conserva sus horas completas aunque la
  // recolección esté encima. Recortarla dejaría al voluntario sin tiempo real de contestar.
  it('no se recorta porque la recolección sea pronto', () => {
    const vencePronto = { ...offer, preferredDate: '2026-10-27' };
    const now = new Date('2026-10-27T15:00:00.000Z');
    expect(isOfferExpired(vencePronto, { now, today: '2026-10-27', offerHours: 12 })).toBe(false);
  });

  // La fecha solo actúa de red: si el día ya pasó, la propuesta sobra aunque falten horas.
  it('vence si el día de la recolección ya pasó', () => {
    const pasada = { ...offer, preferredDate: '2026-10-26' };
    const now = new Date('2026-10-27T12:00:00.000Z');
    expect(isOfferExpired(pasada, { now, today: '2026-10-27', offerHours: 12 })).toBe(true);
  });

  it('una propuesta ya aceptada o cancelada nunca vence', () => {
    const now = new Date('2026-11-30T00:00:00.000Z');
    const options = { now, today: '2026-11-30', offerHours: 12 };
    expect(isOfferExpired({ ...offer, acceptedAt: '2026-10-27T11:00:00.000Z' }, options)).toBe(
      false,
    );
    expect(isOfferExpired({ ...offer, status: 'cancelled' }, options)).toBe(false);
  });
});
