import type { NextFunction, Request, Response } from 'express';

import type { Actor, AuthService } from '../../../application/ports';
import type { UserRepository } from '../../../domain/users/UserRepository';
import { UnauthorizedError } from '../../../domain/shared/errors';

// Exige `Authorization: Bearer <access token de Supabase>` y deja al usuario en res.locals.
export function authenticate(auth: AuthService, users: UserRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedError('Falta el token de sesión.');
    }
    const userId = await auth.verifyToken(token);
    if (!userId) throw new UnauthorizedError('La sesión no es válida o expiró.');

    const actor: Actor = { userId, isAdmin: await users.hasRole(userId, 'admin') };
    res.locals.actor = actor;
    next();
  };
}

export function getActor(res: Response): Actor {
  const actor = res.locals.actor as Actor | undefined;
  if (!actor) throw new UnauthorizedError('Falta el token de sesión.');
  return actor;
}
