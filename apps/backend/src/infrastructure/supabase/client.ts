import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Env } from '../config/env';

// Cliente con la llave secreta: se salta RLS, así que cada caso de uso valida los permisos
// antes de llamar a los repositorios.
export function createSupabaseAdmin(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
