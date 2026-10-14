import { describe, expect, it } from 'vitest';

import { ConflictError, ForbiddenError, ValidationError } from '../shared/errors';
import { accept, decline, isOfferExpired, type Pickup } from './Pickup';

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
