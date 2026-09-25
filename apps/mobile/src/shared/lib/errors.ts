// Supabase devuelve sus errores como objetos planos ({ message, code, details }), no como
// instancias de Error; por eso `e instanceof Error` los perdía y solo se veía el texto genérico.
type ErrorLike = { message?: unknown; code?: unknown };

// Códigos de Postgres/PostgREST que conviene explicar en lenguaje claro.
const FRIENDLY_BY_CODE: Record<string, string> = {
  // RLS rechazó la operación: la cuenta no tiene permiso.
  '42501': 'Tu cuenta no tiene permiso para hacer esto. Si crees que es un error, contacta a BAMX.',
  // Violación de una regla de la base (CHECK).
  '23514': 'Algún dato no cumple las reglas de la base de datos. Revisa el formulario.',
  // Registro duplicado.
  '23505': 'Ese registro ya existe.',
};

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;
  const { message, code } = error as ErrorLike;
  if (typeof code === 'string' && FRIENDLY_BY_CODE[code]) return FRIENDLY_BY_CODE[code];
  if (typeof message === 'string' && /row-level security/i.test(message)) {
    return FRIENDLY_BY_CODE['42501'];
  }
  return typeof message === 'string' && message ? message : fallback;
}
