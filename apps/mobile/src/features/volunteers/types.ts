import type { Enums } from '@/shared/lib/database.types';

export type Weekday = Enums<'weekday'>;
export type VolunteerStatus = Enums<'volunteer_status'>;

// Un archivo elegido en el celular, antes de subirse. Es lo que devuelven expo-image-picker y
// expo-document-picker, reducido a lo que de verdad se necesita para subirlo.
export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
};

/**
 * Cuándo y dónde puede recoger. Es la parte de la solicitud que la asignación automática usa
 * para elegirlo (Fase 8), y la única que puede corregir después de ser aprobado.
 */
export type AvailabilityDraft = {
  days: Weekday[];
  from: string; // 'HH:MM'
  to: string; // 'HH:MM'
  municipalityIds: number[];
};

// Lo que el usuario llenó en el formulario de solicitud.
export type VolunteerApplicationDraft = AvailabilityDraft & {
  photo: PickedFile | null;
  proofOfAddress: PickedFile | null;
  acceptedPrivacy: boolean;
  acceptedTerms: boolean;
  // Solo se usa si el perfil todavía no tiene teléfono.
  phone: string;
};

// La solicitud propia, para saber si ya existe, en qué estado está y poder precargar el
// formulario al volver a enviarla.
export type MyVolunteerApplication = {
  id: string;
  validation_status: VolunteerStatus;
  rejection_reason: string | null;
  created_at: string;
  available_days: Weekday[];
  available_from: string;
  available_to: string;
  municipalityIds: number[];
};
