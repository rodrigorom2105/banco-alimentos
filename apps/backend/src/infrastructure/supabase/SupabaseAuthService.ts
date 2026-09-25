import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthService } from '../../application/ports';

// Valida el access token que la app manda en `Authorization: Bearer <token>`.
export class SupabaseAuthService implements AuthService {
  constructor(private readonly db: SupabaseClient) {}

  async verifyToken(token: string) {
    const { data, error } = await this.db.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  }
}
