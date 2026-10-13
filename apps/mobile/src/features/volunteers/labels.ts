import type { Weekday } from './types';

// Orden de la semana como se muestra en los chips. `weekday` en la base es un enum con estos
// mismos valores, así que el arreglo sirve para dibujar y para validar.
export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mié',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sáb',
  sun: 'Dom',
};

export const VOLUNTEER_STATUS_LABELS = {
  pending: 'En revisión',
  approved: 'Aprobado',
  rejected: 'No aprobado',
  suspended: 'Suspendido',
} as const;
