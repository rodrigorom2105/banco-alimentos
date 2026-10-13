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

// Datos para dar de alta un Centro BAMX (campaña institucional).
export type NewInstitutionalCampaign = {
  name: string;
  description: string | null;
  address: string;
  municipalityId: number;
  latitude: number;
  longitude: number;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  contactPhone: string | null;
};

/**
 * Valida un Centro BAMX antes de crearlo. A diferencia de una campaña comunitaria:
 * no tiene organizador (es de BAMX, no de una persona), las fechas son opcionales y
 * `endDate` en null significa punto permanente. La base lo deja `active` sola.
 */
export function createInstitutional(data: NewInstitutionalCampaign): NewInstitutionalCampaign {
  if (!data.name.trim()) throw new ValidationError('El nombre del centro es obligatorio.');
  if (!data.address.trim()) throw new ValidationError('La dirección es obligatoria.');
  if (data.latitude < -90 || data.latitude > 90) {
    throw new ValidationError('La latitud debe estar entre -90 y 90.');
  }
  if (data.longitude < -180 || data.longitude > 180) {
    throw new ValidationError('La longitud debe estar entre -180 y 180.');
  }
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    throw new ValidationError('La fecha de fin debe ser igual o posterior a la de inicio.');
  }
  return {
    ...data,
    name: data.name.trim(),
    address: data.address.trim(),
    description: data.description?.trim() || null,
    schedule: data.schedule?.trim() || null,
    contactPhone: data.contactPhone?.trim() || null,
  };
}

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
