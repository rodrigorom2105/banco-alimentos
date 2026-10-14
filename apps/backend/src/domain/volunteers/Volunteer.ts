import { ConflictError, ValidationError } from '../shared/errors';

export type VolunteerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Volunteer = {
  id: string;
  userId: string;
  status: VolunteerStatus;
  // Datos de la persona, para que el admin sepa con quién trata.
  firstName: string;
  lastName: string;
  phone: string | null;
  // Se necesita al aprobar: la base exige al menos un municipio (02_rules.sql).
  municipalityIds: number[];
  // Disponibilidad declarada. Las reglas de esta fase no la usan, pero es parte del
  // voluntario y la asignación automática (Fase 8) se basará en ella.
  availableDays: Weekday[];
  availableFrom: string; // 'HH:MM:SS'
  availableTo: string;
  // Rutas en el bucket privado, no URLs: para abrirlas hay que firmar una URL con sesión.
  photoPath: string;
  proofOfAddressPath: string;
  rejectionReason: string | null;
  createdAt: string;
};

// Cambios que produce una revisión; el repositorio los persiste.
export type VolunteerReview = {
  status: VolunteerStatus;
  reviewedBy: string;
  reviewedAt: Date;
  rejectionReason: string | null;
};

export const fullName = (volunteer: Volunteer) =>
  `${volunteer.firstName} ${volunteer.lastName}`.trim();

function requireReason(reason: string, action: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new ValidationError(`El motivo para ${action} es obligatorio.`);
  return trimmed;
}

/**
 * Aprobar. Solo desde `pending`, y la persona debe cubrir al menos un municipio: si no, no
 * hay ninguna solicitud que se le pueda asignar. La base también lo valida, pero aquí el
 * error se puede explicar en español en lugar de salir como un 500 de Postgres.
 */
export function approve(volunteer: Volunteer, reviewerId: string): VolunteerReview {
  if (volunteer.status !== 'pending') {
    throw new ConflictError(
      `Solo se aprueban solicitudes pendientes (estado actual: ${volunteer.status}).`,
    );
  }
  if (volunteer.municipalityIds.length === 0) {
    throw new ConflictError(
      'La solicitud no tiene municipios de cobertura, así que no se le podrían asignar recolecciones. Pide a la persona que vuelva a enviarla.',
    );
  }
  return {
    status: 'approved',
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    // Aprobar limpia un rechazo anterior.
    rejectionReason: null,
  };
}

export function reject(volunteer: Volunteer, reviewerId: string, reason: string): VolunteerReview {
  if (volunteer.status !== 'pending') {
    throw new ConflictError(
      `Solo se rechazan solicitudes pendientes (estado actual: ${volunteer.status}).`,
    );
  }
  return {
    status: 'rejected',
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    rejectionReason: requireReason(reason, 'rechazar'),
  };
}

// Datos que el voluntario puede corregir al volver a enviar su solicitud. Los documentos no
// van aquí: su ruta en el bucket es fija ({user_id}/photo.jpg), así que subir uno nuevo los
// reemplaza sin que la base se entere.
export type VolunteerResubmission = {
  availableDays: Weekday[];
  availableFrom: string;
  availableTo: string;
  municipalityIds: number[];
};

/**
 * Volver a enviar una solicitud rechazada.
 *
 * Solo desde `rejected`: si está pendiente no hay nada que reenviar, y si está suspendida,
 * reaplicar por cuenta propia sería saltarse la decisión de BAMX. Vuelve a `pending` y limpia
 * el motivo del rechazo anterior, que ya no aplica a los datos nuevos.
 */
export function resubmit(volunteer: Volunteer, data: VolunteerResubmission): VolunteerResubmission {
  if (volunteer.status !== 'rejected') {
    throw new ConflictError(
      volunteer.status === 'suspended'
        ? 'Tu voluntariado está suspendido. Comunícate con BAMX para reactivarlo.'
        : `Solo se vuelve a enviar una solicitud rechazada (estado actual: ${volunteer.status}).`,
    );
  }
  if (data.municipalityIds.length === 0) {
    throw new ValidationError('Elige al menos un municipio donde puedas recoger.');
  }
  if (data.availableDays.length === 0) {
    throw new ValidationError('Elige al menos un día disponible.');
  }
  if (data.availableTo <= data.availableFrom) {
    throw new ValidationError('La hora final debe ser posterior a la inicial.');
  }
  return data;
}

/**
 * Suspender. Solo a quien ya estaba aprobado: suspender a alguien pendiente o rechazado no
 * significa nada. El motivo se guarda en `rejection_reason`, que es la única columna de texto
 * que tiene la tabla para explicar una decisión.
 */
export function suspend(volunteer: Volunteer, reviewerId: string, reason: string): VolunteerReview {
  if (volunteer.status !== 'approved') {
    throw new ConflictError(
      `Solo se suspende a un voluntario aprobado (estado actual: ${volunteer.status}).`,
    );
  }
  return {
    status: 'suspended',
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    rejectionReason: requireReason(reason, 'suspender'),
  };
}
