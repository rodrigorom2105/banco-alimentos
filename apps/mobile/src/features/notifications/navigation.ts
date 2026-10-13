import type { Href } from 'expo-router';

import type { Notification } from './types';

/**
 * A qué pantalla lleva cada aviso. El backend guarda los ids en `data`; aquí se traducen a una
 * ruta. Función pura, sin navegar: quien la llama decide qué hacer con el resultado.
 *
 * `null` = el aviso solo se lee, no lleva a ninguna parte (todavía no existe su pantalla).
 */
export function hrefFor(notification: Notification): Href | null {
  const { campaignId } = notification.data ?? {};

  switch (notification.type) {
    // Al organizador le interesa ver su campaña y, si fue rechazada, el motivo.
    case 'campaign_approved':
    case 'campaign_rejected':
    // Al admin, la campaña que tiene que revisar (su pantalla de admin llega en la Fase 5;
    // mientras tanto, la vista de administración de campañas ya sirve).
    case 'campaign_pending_review':
      return campaignId ? { pathname: '/my-campaigns/[id]', params: { id: campaignId } } : null;

    // El panel de voluntario decide qué mostrar según el estado de la solicitud.
    case 'volunteer_approved':
    case 'volunteer_rejected':
    case 'volunteer_suspended':
    case 'pickup_assigned':
    case 'pickup_on_the_way':
    case 'pickup_cancelled':
    case 'pickup_delivered':
      return '/volunteer/dashboard';

    // Avisos para admins cuyas pantallas llegan en las Fases 5 y 8.
    case 'volunteer_pending_review':
    case 'donation_unassigned':
      return null;
  }
}
