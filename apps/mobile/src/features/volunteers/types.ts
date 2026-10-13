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

// Lo que el usuario llenó en el formulario.
export type VolunteerApplicationDraft = {
  photo: PickedFile | null;
  proofOfAddress: PickedFile | null;
  days: Weekday[];
  from: string; // 'HH:MM'
  to: string; // 'HH:MM'
  municipalityIds: number[];
  acceptedPrivacy: boolean;
  acceptedTerms: boolean;
  // Solo se usa si el perfil todavía no tiene teléfono.
  phone: string;
};

// La solicitud propia, para saber si ya existe y en qué estado está.
export type MyVolunteerApplication = {
  id: string;
  validation_status: VolunteerStatus;
  rejection_reason: string | null;
  created_at: string;
};
