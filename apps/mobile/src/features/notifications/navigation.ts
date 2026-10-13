import type { Href } from 'expo-router';

import type { Notification } from './types';

/**
 * A qué pantalla lleva cada aviso. El backend guarda los ids en `data`; aquí se traducen a una
 * ruta. Función pura, sin navegar: quien la llama decide qué hacer con el resultado.
 *
 * `null` = el aviso solo se lee, no lleva a ninguna parte (todavía no existe su pantalla).
 */
export function hrefFor(notification: Notification): Href | null {
  const { campaignId, volunteerId } = notification.data ?? {};

  switch (notification.type) {
    // Al organizador le interesa ver su campaña y, si fue rechazada, el motivo. Y al admin,
    // la campaña que tiene que revisar: la misma pantalla sirve para los dos, porque muestra
    // las acciones de revisión solo si quien entra es admin.
    case 'campaign_approved':
    case 'campaign_rejected':
    case 'campaign_pending_review':
    // La respuesta a una solicitud de apoyo se ve en la campaña que la pidió.
    case 'support_approved':
    case 'support_rejected':
    case 'support_delivered':
      return campaignId ? { pathname: '/my-campaigns/[id]', params: { id: campaignId } } : null;

    // Para el admin: la solicitud de voluntariado que tiene que revisar.
    case 'volunteer_pending_review':
      return volunteerId
        ? { pathname: '/admin/volunteers/[id]', params: { id: volunteerId } }
        : null;

    // El panel de voluntario decide qué mostrar según el estado de la solicitud.
    case 'volunteer_approved':
    case 'volunteer_rejected':
    case 'volunteer_suspended':
    case 'pickup_assigned':
    case 'pickup_on_the_way':
    case 'pickup_cancelled':
    case 'pickup_delivered':
      return '/volunteer/dashboard';

    // Su pantalla llega en la Fase 8 (asignación automática).
    case 'donation_unassigned':
      return null;
  }
}
