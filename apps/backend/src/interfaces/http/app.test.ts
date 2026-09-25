import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { buildContainer } from '../../container';
import { loadEnv } from '../../infrastructure/config/env';
import {
  CAMPAIGN_ID,
  InMemoryCampaignRepository,
  InMemoryUserRepository,
  fakeAuth,
  fixedClock,
  makeCampaign,
} from '../../test-support/inMemory';
import { createApp } from './app';

const env = loadEnv({
  NODE_ENV: 'test',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
});

let server: Server | undefined;

// Levanta la app real (rutas, middlewares y casos de uso) con adaptadores en memoria.
async function start() {
  const campaigns = new InMemoryCampaignRepository([makeCampaign()]);
  const users = new InMemoryUserRepository();
  await users.grantRole('admin', 'admin', null);
  const app = createApp(
    buildContainer(env, { campaigns, users, auth: fakeAuth, clock: fixedClock('2026-09-25') }),
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
      },
    });
  return { call, campaigns };
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

  it('una acción inválida para el estado responde 409', async () => {
    const { call } = await start();
    const res = await call(`/campaigns/${CAMPAIGN_ID}/finish`, {
      method: 'POST',
      token: 'token-organizer',
    });
    expect(res.status).toBe(409);
  });
});
