import type { BadgeTone } from '@/shared/components';

import type { ItemUnit, PickupStatus } from './types';

/**
 * `assigned` aparece como "Por confirmar" porque es el estado de una propuesta que el voluntario
 * todavía no aceptó: mientras no la confirme, la recolección no es suya. Una vez aceptada sigue
 * siendo `assigned` en la base, así que `pickupStatus` distingue los dos casos.
 */
export const PICKUP_STATUS: Record<PickupStatus, { label: string; tone: BadgeTone }> = {
  assigned: { label: 'Por confirmar', tone: 'warning' },
  on_the_way: { label: 'En camino', tone: 'warning' },
  collected: { label: 'Recolectada', tone: 'success' },
  delivered: { label: 'Entregada', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
};

export function pickupStatus(status: PickupStatus, isAccepted: boolean) {
  if (status === 'assigned' && isAccepted) {
    return { label: 'Confirmada', tone: 'success' as BadgeTone };
  }
  return PICKUP_STATUS[status];
}

export const ITEM_UNIT_LABELS: Record<ItemUnit, string> = {
  kg: 'kg',
  g: 'g',
  liter: 'litros',
  ml: 'ml',
  piece: 'piezas',
  package: 'paquetes',
  box: 'cajas',
};
