import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de solicitud no es válido.') });
const listQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'delivered', 'cancelled']).optional(),
});
// El mensaje es opcional al aprobar; el dominio lo exige al rechazar.
const respondBody = z.object({
  approved: z.boolean(),
  message: z.string().trim().default(''),
});

export function supportRoutes({ useCases }: Container) {
  const router = Router();

  router.get('/admin/support-requests', async (req, res) => {
    const { status } = listQuery.parse(req.query);
    res.json(await useCases.listSupportRequestsForReview.execute(getActor(res), status ?? null));
  });

  router.post('/admin/support-requests/:id/respond', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { approved, message } = respondBody.parse(req.body);
    res.json(await useCases.respondSupportRequest.execute(getActor(res), id, approved, message));
  });

  router.post('/admin/support-requests/:id/deliver', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.deliverSupportRequest.execute(getActor(res), id));
  });

  return router;
}
