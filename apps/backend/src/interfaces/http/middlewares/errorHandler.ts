import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { DomainError } from '../../../domain/shared/errors';

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

// Traduce errores de negocio a respuestas HTTP. Los errores inesperados se registran y
// se responden con un mensaje genérico para no filtrar detalles internos.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof DomainError) {
    res
      .status(STATUS_BY_CODE[error.code] ?? 400)
      .json({ error: error.code, message: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Datos inválidos.',
      details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' });
}
