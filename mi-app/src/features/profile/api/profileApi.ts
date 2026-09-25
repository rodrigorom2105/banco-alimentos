import { supabase } from '@/shared/lib/supabase';

import type { Profile } from '../types';

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
};
