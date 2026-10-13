import type { BadgeTone } from '@/shared/components';

import type { SupportStatus, SupportType, VolunteerStatus } from './types';

export const VOLUNTEER_STATUS: Record<VolunteerStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente de revisión', tone: 'warning' },
  approved: { label: 'Aprobado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
  suspended: { label: 'Suspendido', tone: 'danger' },
};

export const SUPPORT_STATUS: Record<SupportStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  approved: { label: 'Aprobada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
  delivered: { label: 'Entregada', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
};

export const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  containers: 'Contenedores',
  promotion: 'Difusión',
  material: 'Material',
  other: 'Otro',
};
