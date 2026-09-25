import type { BadgeTone } from '@/shared/components';

import type { CampaignStatus, CampaignType, SupportStatus, SupportType } from './types';

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  institutional: 'Centro BAMX',
  community: 'Campaña comunitaria',
};

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente de revisión', tone: 'warning' },
  approved: { label: 'Aprobada', tone: 'success' },
  active: { label: 'Activa', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
  finished: { label: 'Finalizada', tone: 'neutral' },
};

export const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  containers: 'Contenedores',
  promotion: 'Difusión',
  material: 'Material',
  other: 'Otro',
};

export const SUPPORT_STATUS: Record<SupportStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Solicitado', tone: 'warning' },
  approved: { label: 'Aprobado', tone: 'success' },
  delivered: { label: 'Entregado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
};
