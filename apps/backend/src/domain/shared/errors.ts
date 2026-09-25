// Errores de negocio. No saben nada de HTTP: la capa de interfaces decide qué código devolver.
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
}

// La operación no es válida en el estado actual (ej. aprobar una campaña ya rechazada).
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}
