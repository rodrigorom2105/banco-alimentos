import { supabase } from '@/shared/lib/supabase';

import type { Notification } from '../types';

const COLUMNS = 'id, type, title, body, data, read_at, created_at';

// Se lee directo de Supabase: RLS solo deja ver y actualizar las filas propias, y un trigger
// impide cambiar cualquier columna que no sea `read_at`. Insertar es imposible desde la app.
export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(COLUMNS)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  // `head: true` pide solo el conteo, sin traer las filas.
  async unreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null);
    if (error) throw error;
    return count ?? 0;
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
    if (error) throw error;
  },

  async markAllRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    if (error) throw error;
  },
};
