import { isAuthError } from '@supabase/supabase-js';

// Códigos de https://supabase.com/docs/guides/auth/debugging/error-codes
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  user_already_exists: 'Ya existe una cuenta con ese correo.',
  email_exists: 'Ya existe una cuenta con ese correo.',
  weak_password: 'La contraseña es demasiado débil.',
  same_password: 'La nueva contraseña debe ser distinta a la anterior.',
  otp_expired: 'El código no es válido o ya expiró. Pide uno nuevo.',
  over_email_send_rate_limit:
    'Enviamos demasiados correos. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  signup_disabled: 'El registro está deshabilitado por ahora.',
};

export function authErrorMessage(error: unknown): string {
  if (isAuthError(error) && error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error instanceof Error && /network|fetch/i.test(error.message)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
