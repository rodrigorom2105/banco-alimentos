// Quién ejecuta la acción. Lo construye la capa HTTP a partir del token de Supabase.
export type Actor = { userId: string; isAdmin: boolean };

export interface AuthService {
  // Devuelve el id del usuario dueño del token, o null si el token no es válido.
  verifyToken(token: string): Promise<string | null>;
}

// Fecha de "hoy" en Guadalajara ('YYYY-MM-DD'); se inyecta para poder probar con fechas fijas.
export interface Clock {
  today(): string;
}
