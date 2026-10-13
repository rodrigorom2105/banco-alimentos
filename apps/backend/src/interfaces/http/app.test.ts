import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { buildContainer } from '../../container';
import { loadEnv } from '../../infrastructure/config/env';
import {
  CAMPAIGN_ID,
  InMemoryCampaignRepository,
  InMemoryNotifier,
  InMemorySupportRequestRepository,
  InMemoryUserRepository,
  InMemoryVolunteerRepository,
  SUPPORT_ID,
  VOLUNTEER_ID,
  fakeAuth,
  fixedClock,
  makeCampaign,
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
async function start() {
  const campaigns = new InMemoryCampaignRepository([makeCampaign()]);
  const volunteers = new InMemoryVolunteerRepository([makeVolunteer()]);
  const support = new InMemorySupportRequestRepository([makeSupportRequest()]);
  const users = new InMemoryUserRepository();
  const notifier = new InMemoryNotifier();
  await users.grantRole('admin', 'admin', null);
  const app = createApp(
    buildContainer(env, {
      campaigns,
      volunteers,
      support,
      users,
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
  return { call, campaigns, volunteers, support, notifier };
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

  it('una acción inválida para el estado responde 409', async () => {
    const { call } = await start();
    const res = await call(`/campaigns/${CAMPAIGN_ID}/finish`, {
      method: 'POST',
      token: 'token-organizer',
    });
    expect(res.status).toBe(409);
  });
});
