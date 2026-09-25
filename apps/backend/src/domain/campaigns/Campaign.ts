import { ConflictError, ValidationError } from '../shared/errors';

export type CampaignType = 'institutional' | 'community';
export type CampaignStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'finished';

export type Campaign = {
  id: string;
  type: CampaignType;
  status: CampaignStatus;
  name: string;
  organizerId: string | null;
  municipalityId: number;
  startDate: string | null; // 'YYYY-MM-DD'
  endDate: string | null;
  rejectionReason: string | null;
};

// Cambios que produce una revisión; el repositorio los persiste.
export type CampaignReview = {
  status: CampaignStatus;
  reviewedBy: string;
  reviewedAt: Date;
  rejectionReason: string | null;
};

// Reglas de estado del esquema (bamx-conecta-db-schema.md, sección 5.7):
// pending → approved o rejected; approved → active → finished.

// Al aprobar, si la fecha de inicio ya llegó la campaña pasa directo a `active`.
export function approve(campaign: Campaign, reviewerId: string, today: string): CampaignReview {
  if (campaign.status !== 'pending') {
    throw new ConflictError(
      `Solo se aprueban campañas pendientes (estado actual: ${campaign.status}).`,
    );
  }
  const hasStarted = !campaign.startDate || campaign.startDate <= today;
  return {
    status: hasStarted ? 'active' : 'approved',
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    rejectionReason: null,
  };
}

export function reject(campaign: Campaign, reviewerId: string, reason: string): CampaignReview {
  if (campaign.status !== 'pending') {
    throw new ConflictError(
      `Solo se rechazan campañas pendientes (estado actual: ${campaign.status}).`,
    );
  }
  if (!reason.trim()) {
    throw new ValidationError('El motivo del rechazo es obligatorio.');
  }
  return {
    status: 'rejected',
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    rejectionReason: reason.trim(),
  };
}

// Finalizar no se puede deshacer y solo aplica a campañas en curso.
export function assertCanFinish(campaign: Campaign) {
  if (campaign.status !== 'approved' && campaign.status !== 'active') {
    throw new ConflictError(
      `Solo se finalizan campañas aprobadas o activas (estado actual: ${campaign.status}).`,
    );
  }
}
