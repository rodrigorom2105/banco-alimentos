import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de campaña no es válido.') });
const listQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'active', 'finished']).optional(),
});
const rejectBody = z.object({ reason: z.string().trim().min(1, 'El motivo es obligatorio.') });

// Centro BAMX: sin organizador y con fechas opcionales (end_date null = permanente).
const institutionalBody = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  description: z.string().trim().nullish(),
  address: z.string().trim().min(1, 'La dirección es obligatoria.'),
  municipalityId: z.coerce.number().int().positive(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  startDate: z.iso.date().nullish(),
  endDate: z.iso.date().nullish(),
  schedule: z.string().trim().nullish(),
  contactPhone: z.string().trim().nullish(),
});

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

  router.post('/admin/campaigns', async (req, res) => {
    const body = institutionalBody.parse(req.body);
    const result = await useCases.createInstitutionalCampaign.execute(getActor(res), {
      name: body.name,
      description: body.description ?? null,
      address: body.address,
      municipalityId: body.municipalityId,
      latitude: body.latitude,
      longitude: body.longitude,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      schedule: body.schedule ?? null,
      contactPhone: body.contactPhone ?? null,
    });
    res.status(201).json(result);
  });

  router.post('/campaigns/:id/finish', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.finishCampaign.execute(getActor(res), id));
  });

  return router;
}
