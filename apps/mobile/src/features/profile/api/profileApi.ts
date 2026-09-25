import { supabase } from '@/shared/lib/supabase';

import type { MyRoles, Profile } from '../types';

export const profileApi = {
  // RLS solo deja leer la fila propia, así que basta con filtrar por el id del usuario.
  async getMine(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updatePhone(userId: string, phone: string) {
    const { error } = await supabase.from('users').update({ phone }).eq('id', userId);
    if (error) throw error;
  },

  // Admin se guarda en user_roles; voluntario se deriva de su solicitud en volunteers.
  async getMyRoles(userId: string): Promise<MyRoles> {
    const [roles, volunteer] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.from('volunteers').select('validation_status').eq('user_id', userId).maybeSingle(),
    ]);
    if (roles.error) throw roles.error;
    if (volunteer.error) throw volunteer.error;
    return {
      isAdmin: roles.data.some((r) => r.role === 'admin'),
      volunteerStatus: volunteer.data?.validation_status ?? null,
    };
  },
};
