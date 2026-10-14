import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { buildContainer } from '../../container';
import { loadEnv } from '../../infrastructure/config/env';
import {
  CAMPAIGN_ID,
  InMemoryCampaignRepository,
  InMemoryDonationRequestRepository,
  InMemoryNotifier,
  InMemoryPickupRepository,
  InMemorySupportRequestRepository,
  InMemoryUserRepository,
  InMemoryVolunteerRepository,
  PICKUP_ID,
  REQUEST_ID,
  SUPPORT_ID,
  VOLUNTEER_ID,
  fakeAuth,
  fixedClock,
  makeCampaign,
  makeDonationRequest,
  makeSupportRequest,
  makeVolunteer,
} from '../../test-support/inMemory';
import { createApp } from './app';

const env = loadEnv({
  NODE_ENV: 'test',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SECRET_KEY: 'test-key',
});

let server: Server | undefined;

// Levanta la app real (rutas, middlewares y casos de uso) con adaptadores en memoria.
const CENTER = {
  id: 'centro-gdl',
  name: 'Centro BAMX Guadalajara',
  municipalityId: 1,
  coordinates: { latitude: 20.7, longitude: -103.344 },
};

// Una recolección ya propuesta al voluntario de `makeVolunteer`, para probar aceptar y rechazar.
// Es una función y no una constante porque los adaptadores en memoria la modifican: compartir
// el mismo objeto entre tests haría que el resultado dependiera del orden en que corren.
const offered = () => ({
  id: PICKUP_ID,
  requestId: REQUEST_ID,
  volunteerId: VOLUNTEER_ID,
  destinationCampaignId: CENTER.id,
  status: 'assigned' as const,
  assignedAt: '2026-09-25T08:00:00.000Z',
  acceptedAt: null,
  preferredDate: '2026-10-28',
  stop: {
    id: 'stop',
    coordinates: { latitude: 20.6736, longitude: -103.344 },
    destination: CENTER.coordinates,
    timeFrom: '10:00:00',
  },
});

async function start() {
  const campaigns = new InMemoryCampaignRepository([makeCampaign()], [CENTER]);
  // El primero queda `pending` porque los tests de revisión lo aprueban; el segundo ya está
  // aprobado para que la asignación automática tenga a quién elegir.
  const volunteers = new InMemoryVolunteerRepository([
    makeVolunteer(),
    makeVolunteer({ id: 'v2', userId: 'u2', status: 'approved' }),
  ]);
  const support = new InMemorySupportRequestRepository([makeSupportRequest()]);
  const users = new InMemoryUserRepository();
  const donationRequests = new InMemoryDonationRequestRepository([makeDonationRequest()]);
  const pickups = new InMemoryPickupRepository([offered()]);
  const notifier = new InMemoryNotifier();
  await users.grantRole('admin', 'admin', null);
  const app = createApp(
    buildContainer(env, {
      campaigns,
      volunteers,
      support,
      users,
      donationRequests,
      pickups,
      auth: fakeAuth,
      clock: fixedClock('2026-09-25'),
      notifier,
    }),
  );
  server = app.listen(0);
  await new Promise((resolve) => server!.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  const call = (path: string, init: RequestInit & { token?: string } = {}) =>
    fetch(`http://localhost:${port}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  return { call, campaigns, volunteers, support, pickups, notifier };
}

afterEach(() => {
  server?.close();
});

describe('API HTTP', () => {
  it('GET /health es pública', async () => {
    const { call } = await start();
    const res = await call('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  // Expo web manda un preflight OPTIONS (sin token) antes de cada petición con Authorization.
  it('responde el preflight de CORS con los métodos que usa la app', async () => {
    const { call } = await start();
    const res = await call(`/campaigns/${CAMPAIGN_ID}/finish`, {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:8081' },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:8081');
    expect(res.headers.get('access-control-allow-methods')).toContain('PATCH');
  });

  it('sin token responde 401', async () => {
    const { call } = await start();
    const res = await call(`/admin/campaigns/${CAMPAIGN_ID}/approve`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('un usuario sin rol admin recibe 403', async () => {
    const { call } = await start();
    const res = await call(`/admin/campaigns/${CAMPAIGN_ID}/approve`, {
      method: 'POST',
      token: 'token-organizer',
    });
    expect(res.status).toBe(403);
  });

  it('un admin aprueba la campaña', async () => {
    const { call, campaigns } = await start();
    const res = await call(`/admin/campaigns/${CAMPAIGN_ID}/approve`, {
      method: 'POST',
      token: 'token-admin',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'approved' });
    expect((await campaigns.findById(CAMPAIGN_ID))?.status).toBe('approved');
  });

  it('valida el cuerpo y los parámetros (400)', async () => {
    const { call } = await start();
    const badId = await call('/admin/campaigns/no-es-uuid/approve', {
      method: 'POST',
      token: 'token-admin',
    });
    expect(badId.status).toBe(400);
    const noReason = await call(`/admin/campaigns/${CAMPAIGN_ID}/reject`, {
      method: 'POST',
      token: 'token-admin',
      body: JSON.stringify({}),
    });
    expect(noReason.status).toBe(400);
  });

  // --- Voluntarios (Fase 5) ---

  it('un admin aprueba a un voluntario', async () => {
    const { call, volunteers } = await start();
    const res = await call(`/admin/volunteers/${VOLUNTEER_ID}/approve`, {
      method: 'POST',
      token: 'token-admin',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'approved' });
    expect((await volunteers.findById(VOLUNTEER_ID))?.status).toBe('approved');
  });

  it('un no admin no puede listar ni revisar voluntarios (403)', async () => {
    const { call } = await start();
    expect((await call('/admin/volunteers', { token: 'token-organizer' })).status).toBe(403);
    expect(
      (
        await call(`/admin/volunteers/${VOLUNTEER_ID}/approve`, {
          method: 'POST',
          token: 'token-organizer',
        })
      ).status,
    ).toBe(403);
  });

  it('rechazar o suspender sin motivo responde 400', async () => {
    const { call } = await start();
    for (const action of ['reject', 'suspend']) {
      const res = await call(`/admin/volunteers/${VOLUNTEER_ID}/${action}`, {
        method: 'POST',
        token: 'token-admin',
        body: JSON.stringify({ reason: '   ' }),
      });
      expect(res.status).toBe(400);
    }
  });

  // --- Solicitudes de apoyo (Fase 5) ---

  it('un admin responde una solicitud de apoyo', async () => {
    const { call, support } = await start();
    const res = await call(`/admin/support-requests/${SUPPORT_ID}/respond`, {
      method: 'POST',
      token: 'token-admin',
      body: JSON.stringify({ approved: true, message: 'Van el jueves.' }),
    });
    expect(res.status).toBe(200);
    expect((await support.findById(SUPPORT_ID))?.status).toBe('approved');
  });

  it('rechazar un apoyo sin mensaje responde 400', async () => {
    const { call } = await start();
    const res = await call(`/admin/support-requests/${SUPPORT_ID}/respond`, {
      method: 'POST',
      token: 'token-admin',
      body: JSON.stringify({ approved: false }),
    });
    expect(res.status).toBe(400);
  });

  // --- Centros BAMX (Fase 5) ---

  it('un admin registra un Centro BAMX y queda activo', async () => {
    const { call, campaigns } = await start();
    const res = await call('/admin/campaigns', {
      method: 'POST',
      token: 'token-admin',
      body: JSON.stringify({
        name: 'Centro BAMX Zapopan',
        address: 'Av. Patria 123',
        municipalityId: 2,
        latitude: 20.72,
        longitude: -103.41,
      }),
    });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    expect((await campaigns.findById(id))?.status).toBe('active');
  });

  it('un no admin no puede registrar un Centro BAMX (403)', async () => {
    const { call } = await start();
    const res = await call('/admin/campaigns', {
      method: 'POST',
      token: 'token-organizer',
      body: JSON.stringify({
        name: 'Centro pirata',
        address: 'Calle 1',
        municipalityId: 1,
        latitude: 20.6,
        longitude: -103.3,
      }),
    });
    expect(res.status).toBe(403);
  });

  it('un Centro BAMX sin coordenadas responde 400', async () => {
    const { call } = await start();
    const res = await call('/admin/campaigns', {
      method: 'POST',
      token: 'token-admin',
      body: JSON.stringify({ name: 'Centro', address: 'Calle 1', municipalityId: 1 }),
    });
    expect(res.status).toBe(400);
  });

  // --- Asignación automática de recolecciones (Fase 8) ---

  it('el donador pide la asignación de su solicitud', async () => {
    const { call, pickups } = await start();
    // La solicitud de prueba ya tiene una propuesta viva, así que primero se cancela para
    // dejarla libre, igual que haría un rechazo.
    await pickups.saveCancellation(PICKUP_ID, 'Prueba');

    const res = await call(`/donation-requests/${REQUEST_ID}/assign`, {
      method: 'POST',
      token: 'token-donor',
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ assigned: true });
  });

  it('un extraño no puede asignar la solicitud de otro (403)', async () => {
    const { call } = await start();
    const res = await call(`/donation-requests/${REQUEST_ID}/assign`, {
      method: 'POST',
      token: 'token-organizer',
    });
    expect(res.status).toBe(403);
  });

  it('solo un admin ve las donaciones sin voluntario', async () => {
    const { call } = await start();
    expect(
      (await call('/admin/donation-requests?unassigned=true', { token: 'token-admin' })).status,
    ).toBe(200);
    expect((await call('/admin/donation-requests', { token: 'token-donor' })).status).toBe(403);
  });

  it('el donador corrige su solicitud', async () => {
    const { call } = await start();
    const res = await call(`/donation-requests/${REQUEST_ID}`, {
      method: 'PATCH',
      token: 'token-donor',
      body: JSON.stringify({
        address: 'Av. Vallarta 1234',
        municipalityId: 1,
        latitude: 20.6736,
        longitude: -103.344,
        preferredDate: '2026-10-28',
        preferredTimeFrom: '10:00:00',
        preferredTimeTo: '12:00:00',
        notes: 'Portón azul',
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ updated: true });
  });

  it('un extraño no puede editar la solicitud de otro (403)', async () => {
    const { call } = await start();
    const res = await call(`/donation-requests/${REQUEST_ID}`, {
      method: 'PATCH',
      token: 'token-organizer',
      body: JSON.stringify({
        address: 'Calle 1',
        municipalityId: 1,
        latitude: 20.6,
        longitude: -103.3,
        preferredDate: '2026-10-28',
        preferredTimeFrom: '10:00:00',
        preferredTimeTo: '12:00:00',
      }),
    });
    expect(res.status).toBe(403);
  });

  it('editar con un horario inválido responde 400', async () => {
    const { call } = await start();
    const res = await call(`/donation-requests/${REQUEST_ID}`, {
      method: 'PATCH',
      token: 'token-donor',
      body: JSON.stringify({
        address: 'Calle 1',
        municipalityId: 1,
        latitude: 20.6,
        longitude: -103.3,
        preferredDate: '2026-10-28',
        preferredTimeFrom: 'mañana',
        preferredTimeTo: '12:00:00',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('el voluntario acepta la recolección que se le propuso', async () => {
    const { call, pickups } = await start();
    const res = await call(`/pickups/${PICKUP_ID}/accept`, {
      method: 'POST',
      token: 'token-volunteer-user',
    });
    expect(res.status).toBe(200);
    expect(pickups.accepted).toEqual([PICKUP_ID]);
  });

  it('otro voluntario no puede contestar esa propuesta (403)', async () => {
    const { call } = await start();
    const res = await call(`/pickups/${PICKUP_ID}/accept`, { method: 'POST', token: 'token-u2' });
    expect(res.status).toBe(403);
  });

  it('rechazar sin motivo responde 400', async () => {
    const { call } = await start();
    const res = await call(`/pickups/${PICKUP_ID}/decline`, {
      method: 'POST',
      token: 'token-volunteer-user',
      body: JSON.stringify({ reason: '  ' }),
    });
    expect(res.status).toBe(400);
  });

  it('el voluntario ve sus recolecciones y nadie más las ve por él', async () => {
    const { call } = await start();
    const mine = await call('/volunteer/pickups', { token: 'token-volunteer-user' });
    expect(mine.status).toBe(200);
    expect((await mine.json()) as unknown[]).toHaveLength(1);
    // Quien no tiene solicitud de voluntariado no tiene recolecciones que ver.
    expect((await call('/volunteer/pickups', { token: 'token-donor' })).status).toBe(404);
  });

  it('una acción inválida para el estado responde 409', async () => {
    const { call } = await start();
    const res = await call(`/campaigns/${CAMPAIGN_ID}/finish`, {
      method: 'POST',
      token: 'token-organizer',
    });
    expect(res.status).toBe(409);
  });
});
