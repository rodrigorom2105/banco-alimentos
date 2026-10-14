import type { BadgeTone } from '@/shared/components';
import type { Enums } from '@/shared/lib/database.types';

export type ItemUnit = Enums<'item_unit'>;

export const DONATION_STATUS: Record<
  Enums<'donation_request_status'>,
  { label: string; tone: BadgeTone; hint: string }
> = {
  pending: {
    label: 'Buscando voluntario',
    tone: 'warning',
    hint: 'Te avisamos en cuanto un voluntario de tu zona tome la recolección.',
  },
  assigned: {
    label: 'Voluntario asignado',
    tone: 'success',
    hint: 'Ten tu donativo empacado y listo para la fecha y el horario que indicaste.',
  },
  // Nunca se muestra tal cual: `donationStatus` la reemplaza según si el voluntario confirmó.
  completed: {
    label: 'Entregada',
    tone: 'success',
    hint: 'Tu donativo ya llegó al punto de acopio. Gracias por apoyar.',
  },
  cancelled: { label: 'Cancelada', tone: 'neutral', hint: '' },
};

/**
 * Qué se le dice al donador sobre su solicitud.
 *
 * `assigned` en la base significa que ya existe una recolección, pero esa recolección puede ser
 * una propuesta que el voluntario todavía no confirmó. Decirle "ya tienes voluntario" en ese
 * momento sería prometer algo que puede no pasar: si rechaza, la solicitud vuelve a buscar.
 */
export function donationStatus(
  status: Enums<'donation_request_status'>,
  isConfirmed: boolean,
): { label: string; tone: BadgeTone; hint: string } {
  if (status !== 'assigned') return DONATION_STATUS[status];
  return isConfirmed
    ? DONATION_STATUS.assigned
    : {
        label: 'Esperando confirmación',
        tone: 'warning',
        hint: 'Ya le propusimos tu donativo a un voluntario de tu zona. Te avisamos en cuanto lo confirme.',
      };
}

// Una solicitud sigue "abierta" mientras algo pueda pasar con ella.
export const isOpen = (status: Enums<'donation_request_status'>) =>
  status === 'pending' || status === 'assigned';

export const ITEM_UNIT_LABELS: Record<ItemUnit, string> = {
  kg: 'kg',
  g: 'g',
  liter: 'litros',
  ml: 'ml',
  piece: 'piezas',
  package: 'paquetes',
  box: 'cajas',
};
