const EMAIL_REGEX = /\S+@\S+\.\S+/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_REGEX = /^\d{10}$/;

export const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim());

// Teléfono a 10 dígitos; se ignoran espacios y guiones.
export const isValidPhone = (phone: string) => PHONE_REGEX.test(phone.replace(/[\s-]/g, ''));

export const PASSWORD_RULE_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.';

// Devuelve el mensaje de error, o null si la contraseña es válida.
export function validateNewPassword(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
  if (!PASSWORD_REGEX.test(password)) return PASSWORD_RULE_MESSAGE;
  return null;
}
