import type { Enums } from '@/shared/lib/database.types';

export type ItemUnit = Enums<'item_unit'>;

export const ITEM_UNIT_LABELS: Record<ItemUnit, string> = {
  kg: 'kg',
  g: 'g',
  liter: 'litros',
  ml: 'ml',
  piece: 'piezas',
  package: 'paquetes',
  box: 'cajas',
};
