import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de voluntario no es válido.') });
const listQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
});
const reasonBody = z.object({ reason: z.string().trim().min(1, 'El motivo es obligatorio.') });

// Revisión de voluntarios: requiere la llave secreta porque RLS no deja que un admin cambie
// `validation_status` sin pasar por aquí, y porque hay que leer varios voluntarios a la vez.
export function volunteersRoutes({ useCases }: Container) {
  const router = Router();

  router.get('/admin/volunteers', async (req, res) => {
    const { status } = listQuery.parse(req.query);
    res.json(await useCases.listVolunteersForReview.execute(getActor(res), status ?? null));
  });

  router.post('/admin/volunteers/:id/approve', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.approveVolunteer.execute(getActor(res), id));
  });

  router.post('/admin/volunteers/:id/reject', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { reason } = reasonBody.parse(req.body);
    res.json(await useCases.rejectVolunteer.execute(getActor(res), id, reason));
  });

  router.post('/admin/volunteers/:id/suspend', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { reason } = reasonBody.parse(req.body);
    res.json(await useCases.suspendVolunteer.execute(getActor(res), id, reason));
  });

  return router;
}
