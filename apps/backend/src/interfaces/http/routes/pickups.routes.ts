import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de la recolección no es válido.') });
const reasonBody = z.object({ reason: z.string().trim().min(1, 'El motivo es obligatorio.') });

/**
 * Recolecciones del voluntario.
 *
 * Ninguna ruta lleva el id del voluntario: se resuelve con el token. Así no hay forma de
 * contestar la propuesta de otra persona, ni siquiera equivocándose al escribir la petición.
 */
export function pickupsRoutes({ useCases }: Container) {
  const router = Router();

  router.get('/volunteer/pickups', async (_req, res) => {
    res.json(await useCases.listMyPickups.execute(getActor(res)));
  });

  router.post('/pickups/:id/accept', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.acceptPickup.execute(getActor(res), id));
  });

  // Con motivo: es lo que le dice a BAMX si el problema fue la zona, el horario o algo del
  // donativo, y lo que justifica no volver a ofrecerle esta misma solicitud.
  router.post('/pickups/:id/decline', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { reason } = reasonBody.parse(req.body);
    res.json(await useCases.declinePickup.execute(getActor(res), id, reason));
  });

  return router;
}
