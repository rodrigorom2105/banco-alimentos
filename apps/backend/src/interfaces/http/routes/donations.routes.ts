import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de la solicitud no es válido.') });

// Asignación automática de recolecciones. Requiere la llave secreta: para elegir al mejor
// voluntario hay que ver la carga de todos, y RLS no deja que ningún usuario de la app lea eso.
export function donationsRoutes({ useCases }: Container) {
  const router = Router();

  // La llama el donador en cuanto crea su solicitud (y un admin al reintentar).
  router.post('/donation-requests/:id/assign', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.autoAssignPickup.execute(getActor(res), id));
  });

  // El filtro `unassigned` existe para no cerrar la puerta: hoy es el único valor que tiene
  // sentido, pero deja lugar a otras vistas del panel sin cambiar la ruta.
  router.get('/admin/donation-requests', async (req, res) => {
    z.object({ unassigned: z.literal('true').optional() }).parse(req.query);
    res.json(await useCases.listUnassignedDonationRequests.execute(getActor(res)));
  });

  router.post('/admin/donation-requests/:id/assign', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.autoAssignPickup.execute(getActor(res), id));
  });

  return router;
}
