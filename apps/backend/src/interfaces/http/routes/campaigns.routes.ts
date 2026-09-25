import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de campaña no es válido.') });
const listQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'active', 'finished']).optional(),
});
const rejectBody = z.object({ reason: z.string().trim().min(1, 'El motivo es obligatorio.') });

// Rutas de campañas que requieren la llave service_role (RLS no permite hacerlas desde la app).
export function campaignsRoutes({ useCases }: Container) {
  const router = Router();

  router.get('/admin/campaigns', async (req, res) => {
    const { status } = listQuery.parse(req.query);
    res.json(await useCases.listCampaignsForReview.execute(getActor(res), status ?? null));
  });

  router.post('/admin/campaigns/:id/approve', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.approveCampaign.execute(getActor(res), id));
  });

  router.post('/admin/campaigns/:id/reject', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { reason } = rejectBody.parse(req.body);
    res.json(await useCases.rejectCampaign.execute(getActor(res), id, reason));
  });

  router.post('/campaigns/:id/finish', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.finishCampaign.execute(getActor(res), id));
  });

  return router;
}
