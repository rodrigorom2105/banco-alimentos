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
