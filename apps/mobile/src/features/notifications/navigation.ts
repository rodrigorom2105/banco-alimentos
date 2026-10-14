import type { Href } from 'expo-router';

import type { Notification } from './types';

/**
 * A qué pantalla lleva cada aviso. El backend guarda los ids en `data`; aquí se traducen a una
 * ruta. Función pura, sin navegar: quien la llama decide qué hacer con el resultado.
 *
 * `null` = el aviso solo se lee, no lleva a ninguna parte (todavía no existe su pantalla).
 */
export function hrefFor(notification: Notification): Href | null {
  const { campaignId, volunteerId, requestId } = notification.data ?? {};

  // Las recolecciones generan el MISMO tipo de aviso para dos personas distintas: el donador
  // y el voluntario. Lo que los distingue es `data`: al donador se le manda `requestId` (su
  // solicitud) y al voluntario no. Sin esto, un donador que toca "Tu recolección va en camino"
  // caía en el panel de voluntario, donde no tiene nada que hacer.
  if (requestId) return { pathname: '/donation/[id]', params: { id: requestId } };

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

    // El panel de voluntario decide qué mostrar según el estado de la solicitud. Los avisos
    // de recolección llegan aquí solo cuando son para el voluntario: los del donador ya se
    // resolvieron arriba con `requestId`.
    case 'volunteer_approved':
    case 'volunteer_rejected':
    case 'volunteer_suspended':
    case 'pickup_assigned':
    case 'pickup_on_the_way':
    case 'pickup_cancelled':
    case 'pickup_delivered':
      return '/volunteer/dashboard';

    // Aviso para admins. No usa `requestId` a propósito (ver `donationUnassigned` en el
    // backend): con esa llave caería en "Mis donaciones", que es del donador y RLS no le deja
    // ver. Lo que el admin necesita es el panel, donde puede reintentar la asignación.
    case 'donation_unassigned':
      return '/admin/donations';
  }
}
