import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de la recolección no es válido.') });
const reasonBody = z.object({ reason: z.string().trim().min(1, 'El motivo es obligatorio.') });

// Las cantidades pueden ser menores a lo declarado, o cero si al final el donador no tenía ese
// producto. Lo que no pueden ser es negativas.
const collectBody = z.object({
  items: z
    .array(
      z.object({
        itemId: z.uuid(),
        collectedQuantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa.'),
      }),
    )
    .min(1, 'Registra cuánto recolectaste de cada producto.'),
});

const deliverBody = z.object({
  evidencePhotoPath: z.string().trim().min(1, 'La foto de la entrega es obligatoria.'),
});

// La ubicación es opcional: si el voluntario no dio permiso, Google Maps arranca donde esté.
const routeQuery = z.object({
  date: z.iso.date(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

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

  router.get('/volunteer/summary', async (_req, res) => {
    res.json(await useCases.getMyPickupSummary.execute(getActor(res)));
  });

  router.get('/volunteer/route', async (req, res) => {
    const { date, lat, lng } = routeQuery.parse(req.query);
    const from = lat !== undefined && lng !== undefined ? { latitude: lat, longitude: lng } : null;
    res.json(await useCases.getMyRoute.execute(getActor(res), date, from));
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

  // Los pasos del flujo: voy en camino → recolectado → entregado.
  router.post('/pickups/:id/start', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.startPickup.execute(getActor(res), id));
  });

  router.post('/pickups/:id/collect', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { items } = collectBody.parse(req.body);
    res.json(await useCases.collectPickup.execute(getActor(res), id, items));
  });

  router.post('/pickups/:id/deliver', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { evidencePhotoPath } = deliverBody.parse(req.body);
    res.json(await useCases.deliverPickup.execute(getActor(res), id, evidencePhotoPath));
  });

  /**
   * Desistir de una recolección ya confirmada. Es distinto de `/decline`: aquí el donador ya
   * contaba con que alguien iba a pasar, así que se le avisa, y la donación se reasigna.
   */
  router.post('/pickups/:id/cancel', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { reason } = reasonBody.parse(req.body);
    res.json(await useCases.cancelPickup.execute(getActor(res), id, reason));
  });

  return router;
}
