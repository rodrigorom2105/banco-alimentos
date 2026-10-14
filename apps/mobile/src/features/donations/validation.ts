import { todayISO } from '@/shared/utils';

import type { DonationDetailsDraft, DonationDetailsErrors } from './types';

/**
 * Valida los datos de la recolección. Función pura: recibe el borrador y devuelve los errores
 * por campo, sin tocar estado ni red.
 *
 * Vive aparte porque se usa al crear la solicitud y al corregirla, y son las mismas reglas que
 * revisa el backend (`editDetails`) y la base. Aquí se revisan antes solo para decirle al
 * usuario qué falta, en el campo donde falta.
 */
export function validateDonationDetails(draft: DonationDetailsDraft): DonationDetailsErrors {
  const errors: DonationDetailsErrors = {};

  if (
    !draft.location.address.trim() ||
    draft.location.latitude === null ||
    draft.location.municipalityId === null
  ) {
    errors.address = 'Indica la dirección, marca el punto en el mapa y elige el municipio.';
  }

  if (!draft.date) errors.date = 'Elige el día en que pueden pasar.';
  else if (draft.date < todayISO()) errors.date = 'La fecha no puede ser en el pasado.';

  if (!draft.timeFrom || !draft.timeTo) errors.time = 'Elige el horario (desde y hasta).';
  else if (draft.timeTo <= draft.timeFrom) {
    errors.time = 'La hora final debe ser posterior a la inicial.';
  }

  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
