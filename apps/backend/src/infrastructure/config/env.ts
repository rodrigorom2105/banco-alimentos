import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

// Se valida al arrancar: si falta una variable el servidor no inicia y dice cuál es.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.url(),
  // Llave con acceso total: solo vive en el backend, nunca en la app ni en el repositorio.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
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
