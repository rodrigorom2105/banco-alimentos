import { parseDate } from '@/shared/utils';

// Los campos trabajan con texto: fechas 'YYYY-MM-DD' (como las guarda Supabase) y horas 'HH:MM'.
export type DateFieldMode = 'date' | 'time';

const pad = (n: number) => String(n).padStart(2, '0');

export function valueToDate(value: string | null, mode: DateFieldMode): Date {
  if (!value) {
    const now = new Date();
    if (mode === 'time') now.setMinutes(0, 0, 0);
    return now;
  }
  if (mode === 'date') return parseDate(value);
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function dateToValue(date: Date, mode: DateFieldMode) {
  return mode === 'date'
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatValue(value: string, mode: DateFieldMode) {
  if (mode === 'time') return value;
  return parseDate(value).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
