import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Env } from '../config/env';

// Cliente con service_role: se salta RLS, así que cada caso de uso valida los permisos antes
// de llamar a los repositorios.
export function createSupabaseAdmin(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
