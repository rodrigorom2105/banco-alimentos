import { supabase } from './supabase';

// URL del backend (apps/backend). Cada integrante la pone en apps/mobile/.env según cómo prueba:
// celular físico http://<IP-de-la-PC>:3000 · emulador Android http://10.0.2.2:3000 · web http://localhost:3000
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

type Method = 'GET' | 'POST' | 'PATCH';

// Error del backend. Conserva el código ({ error, message } del errorHandler) para que la UI
// pueda distinguir casos (FORBIDDEN, CONFLICT…) sin tener que leer el texto del mensaje.
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Los errores de validación (zod) traen `details`; se pegan al mensaje para que el usuario
// vea qué campo falló y no solo "Datos inválidos".
function readError(payload: unknown, status: number): ApiError {
  const code =
    isRecord(payload) && typeof payload.error === 'string' ? payload.error : `HTTP_${status}`;
  const base =
    isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'El servidor respondió con un error inesperado.';
  const details =
    isRecord(payload) && Array.isArray(payload.details)
      ? payload.details
          .map((d) => (isRecord(d) && typeof d.message === 'string' ? d.message : null))
          .filter((m): m is string => !!m)
      : [];
  return new ApiError(code, [base, ...details].join(' '), status);
}

/**
 * Llama al backend con la sesión actual de Supabase.
 *
 * Manda el access token en `Authorization: Bearer`; si no hay sesión no manda nada y el
 * backend responde 401 (salvo en rutas públicas como `/health`). Siempre lanza `ApiError`,
 * así que `getErrorMessage` muestra el mensaje en español que ya escribió el backend.
 */
export async function apiRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      'NO_API_URL',
      'Falta configurar EXPO_PUBLIC_API_URL en el archivo .env de la app.',
      0,
    );
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch solo lanza cuando no hubo respuesta: servidor apagado, IP equivocada o sin red.
    throw new ApiError(
      'NETWORK_ERROR',
      `No se pudo conectar con el servidor de BAMX (${BASE_URL}). Revisa que esté encendido y que el celular esté en la misma red Wi-Fi.`,
      0,
    );
  }

  // 204 (sin contenido) y las respuestas que no son JSON no se pueden parsear.
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw readError(payload, response.status);
  return payload as T;
}
