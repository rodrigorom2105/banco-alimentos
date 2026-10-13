import type { Enums, Tables } from '@/shared/lib/database.types';

export type NotificationType = Enums<'notification_type'>;

export type Notification = Pick<
  Tables<'notifications'>,
  'id' | 'type' | 'title' | 'body' | 'read_at' | 'created_at'
> & {
  // En la base es jsonb; aquí solo se leen ids, así que se trata como un objeto de strings.
  data: Record<string, string>;
};
