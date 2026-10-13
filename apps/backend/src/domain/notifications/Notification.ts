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
  | 'donation_unassigned';

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
