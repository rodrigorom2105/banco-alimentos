import type { PickedFile, VolunteerApplicationDraft } from './types';

// 5 MB, el mismo límite que imponen los buckets en 07_storage_buckets.sql. Se valida aquí
// también para avisar antes de gastar los datos del celular en una subida que va a fallar.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];

export type ApplicationErrors = Partial<
  Record<
    'photo' | 'proofOfAddress' | 'days' | 'time' | 'municipalities' | 'legal' | 'phone',
    string
  >
>;

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

// `missing` en null = el archivo es opcional (ya hay uno guardado en el bucket).
function fileError(file: PickedFile | null, missing: string | null): string | undefined {
  if (!file) return missing ?? undefined;
  if (file.size !== null && file.size > MAX_FILE_BYTES) {
    return `El archivo pesa ${megabytes(file.size)}; el máximo es ${megabytes(MAX_FILE_BYTES)}.`;
  }
  return undefined;
}

/**
 * Valida la solicitud completa. Función pura: recibe el borrador y devuelve los errores por
 * campo, sin tocar estado ni red. `needsPhone` lo decide la pantalla según el perfil.
 */
export function validateApplication(
  draft: VolunteerApplicationDraft,
  needsPhone: boolean,
  // true al volver a enviar: los documentos ya están en el bucket, así que elegir archivos
  // nuevos es opcional. Si se eligen, se validan igual.
  hasStoredFiles = false,
): ApplicationErrors {
  const errors: ApplicationErrors = {};

  const photoError = fileError(draft.photo, hasStoredFiles ? null : 'Agrega una fotografía tuya.');
  if (photoError) errors.photo = photoError;

  const proofError = fileError(
    draft.proofOfAddress,
    hasStoredFiles ? null : 'Agrega tu comprobante de domicilio.',
  );
  if (proofError) errors.proofOfAddress = proofError;
  else if (draft.proofOfAddress && !ALLOWED_PROOF_TYPES.includes(draft.proofOfAddress.mimeType)) {
    errors.proofOfAddress = 'El comprobante debe ser una imagen o un PDF.';
  }

  if (draft.days.length === 0) errors.days = 'Elige al menos un día disponible.';

  if (!draft.from || !draft.to) errors.time = 'Indica tu horario (desde y hasta).';
  else if (draft.to <= draft.from) errors.time = 'La hora final debe ser posterior a la inicial.';

  if (draft.municipalityIds.length === 0) {
    errors.municipalities = 'Elige al menos un municipio donde puedas recoger.';
  }

  if (!draft.acceptedPrivacy || !draft.acceptedTerms) {
    errors.legal = 'Acepta el aviso de privacidad y los términos del voluntariado.';
  }

  if (needsPhone && draft.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Escribe un teléfono de 10 dígitos para que BAMX pueda contactarte.';
  }

  return errors;
}

export const hasErrors = (errors: ApplicationErrors) => Object.keys(errors).length > 0;

// La extensión del comprobante se saca del nombre del archivo; si no trae, se asume que el
// tipo MIME manda (un PDF sin extensión sigue siendo un PDF).
export function extensionFor(file: PickedFile): string {
  const fromName = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  return file.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
}
