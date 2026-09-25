import type { SupabaseClient } from '@supabase/supabase-js';

import type { Role, UserRepository } from '../../domain/users/UserRepository';

const PAGE_SIZE = 1000;

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly db: SupabaseClient) {}

  // El correo vive en auth.users, que no se expone por la API de tablas; se busca con la
  // API de administración, página por página.
  async findIdByEmail(email: string) {
    for (let page = 1; ; page++) {
      const { data, error } = await this.db.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
      if (error) throw error;
      const user = data.users.find((u) => u.email?.toLowerCase() === email);
      if (user) return user.id;
      if (data.users.length < PAGE_SIZE) return null;
    }
  }

  async hasRole(userId: string, role: Role) {
    const { data, error } = await this.db
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  }

  async grantRole(userId: string, role: Role, grantedBy: string | null) {
    const { error } = await this.db
      .from('user_roles')
      .insert({ user_id: userId, role, granted_by: grantedBy });
    if (error) throw error;
  }
}
