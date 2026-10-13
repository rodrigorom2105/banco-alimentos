import { describe, expect, it } from 'vitest';

import { loadEnv } from './env';

const base = { SUPABASE_URL: 'https://proyecto.supabase.co' };

describe('loadEnv', () => {
  it('acepta la llave secreta y aplica los valores por omisión', () => {
    const env = loadEnv({ ...base, SUPABASE_SECRET_KEY: 'sb_secret_abc' });
    expect(env.SUPABASE_SECRET_KEY).toBe('sb_secret_abc');
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
  });

  // Con la llave publicable el backend tendría permisos de invitado: RLS lo filtraría todo,
  // `hasRole` nunca encontraría al admin y los endpoints /admin responderían 403. Más vale
  // que no arranque que dejarlo funcionando a medias.
  it('rechaza la llave publicable', () => {
    expect(() => loadEnv({ ...base, SUPABASE_SECRET_KEY: 'sb_publishable_abc' })).toThrow(
      /publicable/,
    );
  });

  it('rechaza la configuración incompleta y dice qué falta', () => {
    expect(() => loadEnv(base)).toThrow(/SUPABASE_SECRET_KEY/);
  });
});
