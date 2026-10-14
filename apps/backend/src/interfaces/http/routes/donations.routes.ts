import { Router } from 'express';
import { z } from 'zod';

import type { Container } from '../../../container';
import { getActor } from '../middlewares/authenticate';

const idParams = z.object({ id: z.uuid('El id de la solicitud no es válido.') });

// Lo que el donador puede corregir. Los productos no van aquí: se editan por separado, directo
// en Supabase, porque la base ya deja al donador cambiarlos mientras la solicitud esté abierta.
const editBody = z.object({
  address: z.string().trim().min(1, 'La dirección es obligatoria.'),
  addressReferences: z.string().trim().nullish(),
  municipalityId: z.coerce.number().int().positive(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  preferredDate: z.iso.date(),
  preferredTimeFrom: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'El horario no es válido.'),
  preferredTimeTo: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'El horario no es válido.'),
  notes: z.string().trim().nullish(),
  preferredCampaignId: z.uuid().nullish(),
});

// Asignación automática de recolecciones. Requiere la llave secreta: para elegir al mejor
// voluntario hay que ver la carga de todos, y RLS no deja que ningún usuario de la app lea eso.
export function donationsRoutes({ useCases }: Container) {
  const router = Router();

  // La llama el donador en cuanto crea su solicitud (y un admin al reintentar).
  router.post('/donation-requests/:id/assign', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await useCases.autoAssignPickup.execute(getActor(res), id));
  });

  /**
   * Corregir la solicitud. Pasa por el backend porque la base solo deja editarla mientras esté
   * `pending`, y el donador la pierde en cuanto sale la propuesta al voluntario.
   */
  router.patch('/donation-requests/:id', async (req, res) => {
    const { id } = idParams.parse(req.params);
    const body = editBody.parse(req.body);
    res.json(
      await useCases.updateDonationRequest.execute(getActor(res), id, {
        ...body,
        addressReferences: body.addressReferences ?? null,
        notes: body.notes ?? null,
        preferredCampaignId: body.preferredCampaignId ?? null,
      }),
    );
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
