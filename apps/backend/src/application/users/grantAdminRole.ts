import type { UserRepository } from '../../domain/users/UserRepository';
import { ForbiddenError, NotFoundError, ValidationError } from '../../domain/shared/errors';
import type { Actor } from '../ports';

// Actor = null cuando se ejecuta desde la terminal del servidor (para crear el primer admin,
// quien tenga la llave service_role). Por HTTP, solo otro admin puede asignar el rol.
export class GrantAdminRole {
  constructor(private readonly users: UserRepository) {}

  async execute(actor: Actor | null, email: string) {
    if (actor && !actor.isAdmin) {
      throw new ForbiddenError('Solo un admin puede asignar el rol de admin.');
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) throw new ValidationError('Correo inválido.');

    const userId = await this.users.findIdByEmail(normalized);
    if (!userId) {
      throw new NotFoundError(
        `No existe una cuenta con el correo ${normalized}. Regístrala primero.`,
      );
    }
    if (await this.users.hasRole(userId, 'admin')) {
      return { userId, alreadyAdmin: true };
    }
    await this.users.grantRole(userId, 'admin', actor?.userId ?? null);
    return { userId, alreadyAdmin: false };
  }
}
