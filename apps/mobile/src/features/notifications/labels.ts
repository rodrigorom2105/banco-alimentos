import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { NotificationType } from './types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Ícono por tipo de aviso, para reconocerlos de un vistazo en la lista.
export const NOTIFICATION_ICONS: Record<NotificationType, IconName> = {
  campaign_approved: 'bullhorn-outline',
  campaign_rejected: 'bullhorn-outline',
  campaign_pending_review: 'clipboard-list-outline',
  volunteer_approved: 'account-heart-outline',
  volunteer_rejected: 'account-heart-outline',
  volunteer_suspended: 'account-heart-outline',
  volunteer_pending_review: 'account-heart-outline',
  pickup_assigned: 'home-heart',
  pickup_on_the_way: 'home-heart',
  pickup_cancelled: 'home-heart',
  pickup_delivered: 'home-heart',
  donation_unassigned: 'clipboard-list-outline',
  support_approved: 'hand-heart-outline',
  support_rejected: 'hand-heart-outline',
  support_delivered: 'hand-heart-outline',
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "hace 5 min", "hace 3 h", "ayer" o la fecha. Función pura: recibe el `now` para poder
 * probarla con un instante fijo.
 */
export function formatRelative(createdAt: string, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(createdAt).getTime();

  if (elapsed < MINUTE) return 'ahora';
  if (elapsed < HOUR) return `hace ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `hace ${Math.floor(elapsed / HOUR)} h`;
  if (elapsed < 2 * DAY) return 'ayer';
  return new Date(createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
