// Las fechas de Supabase llegan como 'YYYY-MM-DD'. `new Date(str)` las toma como UTC y en
// México eso las recorre un día hacia atrás, así que se construyen en hora local.
export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDayMonth(value: string) {
  return parseDate(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Máscara para escribir fechas como dd/mm/aaaa: solo deja dígitos y agrega las diagonales.
export function maskDateInput(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

// Máscara para horas como HH:MM.
export function maskTimeInput(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

// 'dd/mm/aaaa' → 'YYYY-MM-DD', o null si la fecha no existe (ej. 31/02/2026).
export function displayDateToISO(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  const isReal =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isReal ? `${year}-${pad(month)}-${pad(day)}` : null;
}

// 'YYYY-MM-DD' → 'dd/mm/aaaa' para mostrar en los campos de fecha.
export function isoToDisplayDate(value: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

// 'HH:MM' válido en 24 horas → 'HH:MM:00' para columnas `time`, o null.
export function displayTimeToSQL(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? `${match[1]}:${match[2]}:00` : null;
}
