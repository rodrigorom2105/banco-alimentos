import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { profileApi, useMyProfile } from '@/features/profile';
import { useAuth } from '@/providers';
import { Button, Field, FormScreen, Input, SuccessState } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, fonts, spacing } from '@/shared/theme';

import { volunteersApi } from '../api/volunteersApi';
import { chooseProofOfAddress, choosePhoto, takePhoto } from '../pickers';
import type { MyVolunteerApplication, PickedFile, VolunteerApplicationDraft } from '../types';
import { hasErrors, validateApplication, type ApplicationErrors } from '../validation';
import { AvailabilityFields } from './AvailabilityFields';
import { Checkbox } from './Checkbox';
import { FilePickerField } from './FilePickerField';

const EMPTY: VolunteerApplicationDraft = {
  photo: null,
  proofOfAddress: null,
  days: [],
  from: '',
  to: '',
  municipalityIds: [],
  acceptedPrivacy: false,
  acceptedTerms: false,
  phone: '',
};

// Al volver a enviar se precarga lo que ya había: casi siempre el rechazo fue por un
// documento, no por la disponibilidad, así que no tiene por qué capturarlo todo de nuevo.
// Las casillas sí se vuelven a marcar: es una aceptación nueva, con fecha nueva.
const draftFrom = (application: MyVolunteerApplication): VolunteerApplicationDraft => ({
  ...EMPTY,
  days: application.available_days,
  from: application.available_from.slice(0, 5),
  to: application.available_to.slice(0, 5),
  municipalityIds: application.municipalityIds,
});

// Con `application` el formulario corrige esa solicitud rechazada; sin ella, crea una nueva.
export function VolunteerForm({ application }: { application?: MyVolunteerApplication }) {
  const { user } = useAuth();
  const { profile, email, isLoading: isLoadingProfile } = useMyProfile();

  const isResubmission = !!application;
  const [draft, setDraft] = useState<VolunteerApplicationDraft>(
    application ? draftFrom(application) : EMPTY,
  );
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // El esquema exige teléfono antes de crear la solicitud (lo valida un trigger); si falta en
  // el perfil se pide aquí, igual que en el formulario de donación.
  const needsPhone = !isLoadingProfile && !profile?.phone;
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '';

  const update = (changes: Partial<VolunteerApplicationDraft>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  // Al elegir un archivo se cancela si el usuario no dio permiso o se arrepintió (null).
  const pick = (key: 'photo' | 'proofOfAddress', run: () => Promise<PickedFile | null>) =>
    run().then((file) => file && update({ [key]: file }));

  const submit = async () => {
    const found = validateApplication(draft, needsPhone, isResubmission);
    setErrors(found);
    setSubmitError(null);
    if (hasErrors(found) || !user) return;

    setIsSubmitting(true);
    try {
      if (needsPhone) await profileApi.updatePhone(user.id, draft.phone.trim());
      const common = {
        days: draft.days,
        from: draft.from,
        to: draft.to,
        municipalityIds: draft.municipalityIds,
      };
      if (isResubmission) {
        // Los archivos van como vengan: si no eligió nuevos, se conservan los del bucket.
        await volunteersApi.resubmit(user.id, {
          ...common,
          photo: draft.photo,
          proofOfAddress: draft.proofOfAddress,
        });
      } else {
        await volunteersApi.apply(user.id, {
          ...common,
          photo: draft.photo!,
          proofOfAddress: draft.proofOfAddress!,
        });
      }
      setIsDone(true);
    } catch (e) {
      setSubmitError(getErrorMessage(e, 'No se pudo enviar tu solicitud.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <SuccessState
        title={isResubmission ? '¡Solicitud reenviada!' : '¡Solicitud enviada!'}
        message="BAMX va a revisar tus datos y te avisaremos en cuanto haya respuesta. Puedes ver el estado de tu solicitud en Ayudar > Mi voluntariado."
        actionLabel="Entendido"
        onAction={() => router.replace('/help')}
      />
    );
  }

  return (
    <FormScreen>
      <Field label="Tus datos" hint="Vienen de tu cuenta.">
        <Input variant="filled" value={fullName} editable={false} placeholder="Nombre" />
        <Input variant="filled" value={email ?? ''} editable={false} placeholder="Correo" />
      </Field>

      {needsPhone && (
        <Field label="Teléfono" error={errors.phone} hint="Se guarda en tu perfil.">
          <Input
            variant="filled"
            value={draft.phone}
            onChangeText={(phone) => update({ phone })}
            placeholder="33 1234 5678"
            keyboardType="phone-pad"
          />
        </Field>
      )}

      <AvailabilityFields value={draft} onChange={update} errors={errors} />

      <Field
        label="Tu fotografía"
        error={errors.photo}
        hint={
          isResubmission
            ? 'Ya tienes una guardada. Sube otra solo si quieres cambiarla.'
            : 'Sirve para que quien dona sepa a quién esperar.'
        }
      >
        <FilePickerField
          file={draft.photo}
          showPreview
          actions={[
            { label: 'Tomar foto', onPress: () => pick('photo', takePhoto) },
            { label: 'Elegir de galería', onPress: () => pick('photo', choosePhoto) },
          ]}
          onClear={() => update({ photo: null })}
        />
      </Field>

      <Field
        label="Comprobante de domicilio"
        error={errors.proofOfAddress}
        hint={
          isResubmission
            ? 'Ya tienes uno guardado. Sube otro solo si quieres cambiarlo.'
            : 'Recibo de luz, agua o predial. PDF o imagen, máximo 5 MB.'
        }
      >
        <FilePickerField
          file={draft.proofOfAddress}
          actions={[
            {
              label: 'Elegir archivo',
              onPress: () => pick('proofOfAddress', chooseProofOfAddress),
            },
          ]}
          onClear={() => update({ proofOfAddress: null })}
        />
      </Field>

      <Field label="Autorizaciones" error={errors.legal}>
        <View style={styles.legal}>
          <Checkbox
            checked={draft.acceptedPrivacy}
            onToggle={() => update({ acceptedPrivacy: !draft.acceptedPrivacy })}
            label="Acepto el aviso de privacidad"
          >
            <Text style={styles.legalText}>
              He leído y acepto el{' '}
              <Link href="/legal/privacy" style={styles.link}>
                aviso de privacidad
              </Link>
              , incluido el tratamiento de mi fotografía y mi comprobante de domicilio.
            </Text>
          </Checkbox>
          <Checkbox
            checked={draft.acceptedTerms}
            onToggle={() => update({ acceptedTerms: !draft.acceptedTerms })}
            label="Acepto los términos del voluntariado"
          >
            <Text style={styles.legalText}>
              Acepto los{' '}
              <Link href="/legal/terms" style={styles.link}>
                términos del voluntariado
              </Link>
              .
            </Text>
          </Checkbox>
        </View>
      </Field>

      {submitError && <Text style={styles.submitError}>{submitError}</Text>}
      <Button
        title={isResubmission ? 'Volver a enviar' : 'Enviar solicitud'}
        onPress={submit}
        loading={isSubmitting}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  legal: { gap: spacing.md },
  legalText: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  link: { color: colors.primary, fontFamily: fonts.heading },
  submitError: { color: colors.danger, textAlign: 'center' },
});
