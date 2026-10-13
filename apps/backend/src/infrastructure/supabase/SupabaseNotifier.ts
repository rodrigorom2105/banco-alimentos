import type { SupabaseClient } from '@supabase/supabase-js';

import type { NewNotification } from '../../domain/notifications/Notification';
import type { Notifier } from '../../domain/notifications/Notifier';

// Guarda cada aviso como una fila de `notifications`. La tabla no tiene política de insert,
// así que solo puede escribir quien use la llave secreta: este backend y los triggers.
export class SupabaseNotifier implements Notifier {
  constructor(private readonly db: SupabaseClient) {}

  async notify(userId: string, notification: NewNotification) {
    await this.insert([{ user_id: userId, ...toRow(notification) }]);
  }

  async notifyAdmins(notification: NewNotification, except: string | null = null) {
    const { data, error } = await this.db
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .returns<{ user_id: string }[]>();
    if (error) throw error;

    const ids = data.map((r) => r.user_id).filter((id) => id !== except);
    if (ids.length === 0) return;
    await this.insert(ids.map((id) => ({ user_id: id, ...toRow(notification) })));
  }

  private async insert(rows: Record<string, unknown>[]) {
    const { error } = await this.db.from('notifications').insert(rows);
    if (error) throw error;
  }
}

const toRow = (n: NewNotification) => ({
  type: n.type,
  title: n.title,
  body: n.body,
  data: n.data,
});
