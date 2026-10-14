import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

// Se valida al arrancar: si falta una variable el servidor no inicia y dice cuál es.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.url(),
  // Llave secreta (`sb_secret_…`, antes `service_role`): se salta RLS, así que tiene acceso
  // total. Solo vive en el backend, nunca en la app ni en el repositorio. Si aquí se pone por
  // error la llave publicable, el backend queda con permisos de invitado y todo responde 403.
  SUPABASE_SECRET_KEY: z
    .string()
    .min(1)
    .refine((key) => !key.startsWith('sb_publishable_'), {
      message: 'es la llave publicable; se necesita la secreta (sb_secret_…) de Supabase.',
    }),
  // Orígenes permitidos para CORS (separados por coma); vacío = sin restricción en desarrollo.
  CORS_ORIGINS: z.string().default(''),

  // Topes de la asignación automática de recolecciones (Fase 8). Cuidan las horas de servicio
  // del voluntario, así que BAMX los va a querer ajustar sin tocar código.
  ASSIGNMENT_MAX_PICKUPS_PER_DAY: z.coerce.number().int().positive().default(5),
  ASSIGNMENT_MAX_ROUTE_KM: z.coerce.number().positive().default(25),
  ASSIGNMENT_MAX_PICKUPS_PER_MONTH: z.coerce.number().int().positive().default(15),
  // Cuántas horas tiene el voluntario para confirmar una recolección antes de que se le
  // ofrezca a otra persona. El tope de 24 es a propósito: más allá, la donación se enfría.
  ASSIGNMENT_OFFER_HOURS: z.coerce.number().int().min(1).max(24).default(12),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Configuración inválida en .env:\n${missing.join('\n')}`);
  }
  return result.data;
}
