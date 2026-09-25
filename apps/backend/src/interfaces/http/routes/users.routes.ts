import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const grantBody = z.object({ email: z.email('Correo inválido.') });

export function usersRoutes({ useCases }: Container) {
  const router = Router();

  // Asigna el rol de admin a una cuenta existente. Solo otro admin puede hacerlo por HTTP;
  // el primer admin se crea con `pnpm --filter backend grant-admin <correo>`.
  router.post('/admin/admins', async (req, res) => {
    const { email } = grantBody.parse(req.body);
    const result = await useCases.grantAdminRole.execute(getActor(res), email);
    res.status(result.alreadyAdmin ? 200 : 201).json(result);
  });

  return router;
}
