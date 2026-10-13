import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { profileApi, useMyProfile } from '@/features/profile';
import { useAuth } from '@/providers';
import {
  Button,
  DateField,
  Field,
  FilterChip,
  FormScreen,
  Input,
  SuccessState,
} from '@/shared/components';
import { useMunicipalities } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, spacing } from '@/shared/theme';

import { volunteersApi } from '../api/volunteersApi';
import { WEEKDAY_LABELS, WEEKDAYS } from '../labels';
import { chooseProofOfAddress, choosePhoto, takePhoto } from '../pickers';
import type { PickedFile, VolunteerApplicationDraft, Weekday } from '../types';
import { hasErrors, validateApplication, type ApplicationErrors } from '../validation';
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

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function VolunteerForm() {
  const { user } = useAuth();
  const { profile, email, isLoading: isLoadingProfile } = useMyProfile();
  const { items: municipalities, error: municipalitiesError } = useMunicipalities();

  const [draft, setDraft] = useState<VolunteerApplicationDraft>(EMPTY);
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
    const found = validateApplication(draft, needsPhone);
    setErrors(found);
    setSubmitError(null);
    if (hasErrors(found) || !user) return;

    setIsSubmitting(true);
    try {
      if (needsPhone) await profileApi.updatePhone(user.id, draft.phone.trim());
      await volunteersApi.apply(user.id, {
        photo: draft.photo!,
        proofOfAddress: draft.proofOfAddress!,
        days: draft.days,
        from: draft.from,
        to: draft.to,
        municipalityIds: draft.municipalityIds,
      });
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
        title="¡Solicitud enviada!"
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

      <Field
        label="Municipios donde puedes recoger"
        error={errors.municipalities ?? municipalitiesError ?? undefined}
      >
        <View style={styles.chips}>
          {municipalities.map((municipality) => (
            <FilterChip
              key={municipality.id}
              label={municipality.name}
              selected={draft.municipalityIds.includes(municipality.id)}
              onPress={() =>
                update({ municipalityIds: toggle(draft.municipalityIds, municipality.id) })
              }
            />
          ))}
        </View>
      </Field>

      <Field label="Días disponibles" error={errors.days}>
        <View style={styles.chips}>
          {WEEKDAYS.map((day: Weekday) => (
            <FilterChip
              key={day}
              label={WEEKDAY_LABELS[day]}
              selected={draft.days.includes(day)}
              onPress={() => update({ days: toggle(draft.days, day) })}
            />
          ))}
        </View>
      </Field>

      <Field label="Horario" error={errors.time} hint="El mismo para todos los días que elegiste.">
        <View style={styles.row}>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={draft.from || null}
              onChange={(from) => update({ from })}
              placeholder="Desde"
            />
          </View>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={draft.to || null}
              onChange={(to) => update({ to })}
              placeholder="Hasta"
            />
          </View>
        </View>
      </Field>

      <Field
        label="Tu fotografía"
        error={errors.photo}
        hint="Sirve para que quien dona sepa a quién esperar."
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
        hint="Recibo de luz, agua o predial. PDF o imagen, máximo 5 MB."
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
      <Button title="Enviar solicitud" onPress={submit} loading={isSubmitting} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  // minWidth 0: sin esto, en web los campos no se encogen y la fila se sale de la pantalla.
  flex: { flex: 1, minWidth: 0 },
  legal: { gap: spacing.md },
  legalText: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '600' },
  submitError: { color: colors.danger, textAlign: 'center' },
});
