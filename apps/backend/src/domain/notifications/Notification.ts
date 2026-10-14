import type { Campaign } from '../campaigns/Campaign';

export type NotificationType =
  | 'campaign_approved'
  | 'campaign_rejected'
  | 'campaign_pending_review'
  | 'volunteer_approved'
  | 'volunteer_rejected'
  | 'volunteer_suspended'
  | 'volunteer_pending_review'
  | 'pickup_assigned'
  | 'pickup_on_the_way'
  | 'pickup_cancelled'
  | 'pickup_delivered'
  | 'donation_unassigned'
  // Agregados al enum de la base en 07c_support_notification_types.sql.
  | 'support_approved'
  | 'support_rejected'
  | 'support_delivered';

// Un aviso listo para guardarse. `data` lleva los ids que la app necesita para saber a qué
// pantalla navegar al tocarlo; son strings porque viajan como JSON.
export type NewNotification = {
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
};

// Los textos viven aquí, en el dominio, y no en la base ni en la app: son parte de las reglas
// de negocio (qué se le dice a quién y cuándo), no un detalle de cómo se guardan.

export function campaignApproved(campaign: Campaign): NewNotification {
  // `approve` del dominio puede dejarla en `active` si su fecha de inicio ya llegó; el mensaje
  // tiene que decir la verdad sobre si ya se ve en el mapa o todavía no.
  const isVisible = campaign.status === 'active';
  return {
    type: 'campaign_approved',
    title: 'Tu campaña fue aprobada',
    body: isVisible
      ? `${campaign.name} ya aparece en Explorar.`
      : `${campaign.name} aparecerá en Explorar cuando llegue su fecha de inicio.`,
    data: { campaignId: campaign.id },
  };
}

export function campaignRejected(campaign: Campaign, reason: string): NewNotification {
  return {
    type: 'campaign_rejected',
    title: 'Tu campaña no fue aprobada',
    body: `${campaign.name}: ${reason}`,
    data: { campaignId: campaign.id },
  };
}

export function volunteerApproved(): NewNotification {
  return {
    type: 'volunteer_approved',
    title: '¡Ya eres voluntario de BAMX!',
    body: 'Tu solicitud fue aprobada. Te vamos a avisar cuando tengas una recolección asignada.',
    data: {},
  };
}

// Reusa el tipo `volunteer_approved` en lugar de pedir un valor nuevo en el enum de la base:
// para la app significan lo mismo (tu acceso está activo) y llevan a la misma pantalla.
export function volunteerReactivated(): NewNotification {
  return {
    type: 'volunteer_approved',
    title: 'Tu voluntariado está activo otra vez',
    body: 'BAMX levantó la suspensión. Ya puedes volver a recibir recolecciones.',
    data: {},
  };
}

export function volunteerRejected(reason: string): NewNotification {
  return {
    type: 'volunteer_rejected',
    title: 'Tu solicitud de voluntariado no fue aprobada',
    body: reason,
    data: {},
  };
}

// Para los admins. El mismo aviso que manda el trigger de 06_notifications.sql cuando llega
// una solicitud nueva; aquí se usa cuando alguien vuelve a enviar la suya (eso es un UPDATE,
// y el trigger solo cubre los INSERT).
export function volunteerPendingReview(volunteerId: string, name: string): NewNotification {
  return {
    type: 'volunteer_pending_review',
    title: 'Solicitud de voluntariado corregida',
    body: `${name} volvió a enviar su solicitud.`,
    data: { volunteerId },
  };
}

export function volunteerSuspended(reason: string): NewNotification {
  return {
    type: 'volunteer_suspended',
    title: 'Tu voluntariado está suspendido',
    body: `${reason} Si tienes dudas, comunícate con BAMX.`,
    data: {},
  };
}

// Solicitudes de apoyo de una campaña comunitaria (contenedores, difusión, material).
export function supportResponded(
  support: { id: string; campaignId: string },
  approved: boolean,
  message: string | null,
): NewNotification {
  return {
    type: approved ? 'support_approved' : 'support_rejected',
    title: approved ? 'BAMX aprobó tu solicitud de apoyo' : 'BAMX no aprobó tu solicitud de apoyo',
    body: message ?? (approved ? 'Pronto nos pondremos en contacto.' : 'Sin comentarios.'),
    data: { campaignId: support.campaignId, supportRequestId: support.id },
  };
}

export function supportDelivered(support: { id: string; campaignId: string }): NewNotification {
  return {
    type: 'support_delivered',
    title: 'Tu apoyo fue entregado',
    body: 'BAMX marcó como entregado el apoyo que solicitaste.',
    data: { campaignId: support.campaignId, supportRequestId: support.id },
  };
}
