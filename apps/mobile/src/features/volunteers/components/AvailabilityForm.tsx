import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, FormScreen, Text } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors } from '@/shared/theme';

import { volunteersApi } from '../api/volunteersApi';
import type { AvailabilityDraft, MyVolunteerApplication } from '../types';
import { hasErrors, validateAvailability, type AvailabilityErrors } from '../validation';
import { AvailabilityFields } from './AvailabilityFields';

/**
 * Corregir cuándo y dónde puede recoger el voluntario.
 *
 * Existe porque la asignación automática (Fase 8) elige a quién le propone cada recolección a
 * partir de estos tres datos. Sin poder cambiarlos, alguien que cambia de horario solo puede
 * rechazar propuestas una por una o dejar de recibir cualquier cosa en silencio.
 *
 * No incluye los documentos ni las autorizaciones: eso es volver a enviar la solicitud, que es
 * otra cosa (vuelve a revisión) y vive en `VolunteerForm`.
 */
export function AvailabilityForm({ application }: { application: MyVolunteerApplication }) {
  const [draft, setDraft] = useState<AvailabilityDraft>({
    days: application.available_days,
    from: application.available_from.slice(0, 5),
    to: application.available_to.slice(0, 5),
    municipalityIds: application.municipalityIds,
  });
  const [errors, setErrors] = useState<AvailabilityErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (changes: Partial<AvailabilityDraft>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  const submit = async () => {
    const found = validateAvailability(draft);
    setErrors(found);
    setSubmitError(null);
    if (hasErrors(found)) return;

    setIsSubmitting(true);
    try {
      await volunteersApi.updateAvailability(draft);
      // `back` y no `replace`: se vuelve a Mi voluntariado, que recarga al recibir el foco
      // (useFocusQuery) y por eso ya muestra los datos nuevos.
      router.back();
    } catch (e) {
      setSubmitError(getErrorMessage(e, 'No se pudo guardar tu disponibilidad.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormScreen>
      <Text style={styles.intro}>
        Según esto te proponemos las recolecciones: solo te llegan donativos de los municipios, los
        días y el horario que elijas aquí.
      </Text>

      <AvailabilityFields value={draft} onChange={update} errors={errors} />

      {submitError && <Text style={styles.submitError}>{submitError}</Text>}
      <Button title="Guardar cambios" onPress={submit} loading={isSubmitting} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  submitError: { color: colors.danger, textAlign: 'center' },
});
