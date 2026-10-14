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

  // Los topes de la asignación tienen valor por omisión a propósito: si faltaran, nadie podría
  // levantar el backend sin configurarlos, y la mayoría nunca los va a cambiar.
  it('aplica los topes de asignación por omisión y acepta otros', () => {
    const env = loadEnv({ ...base, SUPABASE_SECRET_KEY: 'sb_secret_abc' });
    expect(env.ASSIGNMENT_MAX_PICKUPS_PER_DAY).toBe(5);
    expect(env.ASSIGNMENT_MAX_ROUTE_KM).toBe(25);
    expect(env.ASSIGNMENT_MAX_PICKUPS_PER_MONTH).toBe(15);
    expect(env.ASSIGNMENT_OFFER_HOURS).toBe(12);

    const custom = loadEnv({
      ...base,
      SUPABASE_SECRET_KEY: 'sb_secret_abc',
      ASSIGNMENT_MAX_PICKUPS_PER_DAY: '3',
      ASSIGNMENT_OFFER_HOURS: '24',
    });
    expect(custom.ASSIGNMENT_MAX_PICKUPS_PER_DAY).toBe(3);
    expect(custom.ASSIGNMENT_OFFER_HOURS).toBe(24);
  });

  // Un plazo de 48 h dejaría la donación congelada dos días; el de 0 la haría vencer al
  // instante. Más vale no arrancar que asignar con un plazo imposible.
  it('rechaza un plazo de confirmación fuera de 1 a 24 horas', () => {
    for (const hours of ['0', '48']) {
      expect(() =>
        loadEnv({ ...base, SUPABASE_SECRET_KEY: 'sb_secret_abc', ASSIGNMENT_OFFER_HOURS: hours }),
      ).toThrow(/ASSIGNMENT_OFFER_HOURS/);
    }
  });
});
