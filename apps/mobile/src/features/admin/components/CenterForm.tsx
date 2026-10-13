import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AddressPicker,
  Button,
  DateField,
  EMPTY_ADDRESS,
  Field,
  FormScreen,
  Input,
  SuccessState,
  type AddressValue,
} from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, spacing } from '@/shared/theme';

import { adminApi } from '../api/adminApi';

type Errors = Partial<Record<'name' | 'address' | 'dates' | 'submit', string>>;

/**
 * Alta de un Centro BAMX. No reutiliza `CampaignForm` porque, aunque los campos se parecen,
 * el comportamiento es distinto: aquí no hay organizador, las fechas son opcionales, el
 * guardado pasa por el backend (no por Supabase) y el centro nace `active` sin revisión.
 * Meter todo eso en un `modo` dentro de `CampaignForm` lo volvería un formulario con dos
 * personalidades. Los componentes compartidos sí son los mismos.
 */
export function CenterForm() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState<AddressValue>(EMPTY_ADDRESS);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const submit = async () => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Escribe el nombre del centro.';
    if (!location.address.trim() || location.latitude === null || location.municipalityId === null)
      next.address = 'Indica la dirección, marca el punto en el mapa y elige el municipio.';
    if (startDate && endDate && endDate < startDate)
      next.dates = 'La fecha de fin debe ser igual o posterior a la de inicio.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      const { id } = await adminApi.createCenter({
        name: name.trim(),
        description: description.trim() || null,
        address: location.address.trim(),
        municipalityId: location.municipalityId!,
        latitude: location.latitude!,
        longitude: location.longitude!,
        startDate: startDate || null,
        endDate: endDate || null,
        schedule: schedule.trim() || null,
        contactPhone: phone.trim() || null,
      });
      setCreatedId(id);
    } catch (e) {
      setErrors({ submit: getErrorMessage(e, 'No se pudo registrar el centro.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdId) {
    return (
      <SuccessState
        title="Centro publicado"
        message="El centro ya aparece en Explorar, sin pasar por revisión."
        actionLabel="Ver en el mapa"
        onAction={() => router.replace('/explore')}
      />
    );
  }

  return (
    <FormScreen>
      <Field label="Nombre del centro" error={errors.name}>
        <Input
          variant="filled"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Centro BAMX Zapopan"
        />
      </Field>

      <Field label="Ubicación">
        <AddressPicker value={location} onChange={setLocation} error={errors.address} />
      </Field>

      <Field
        label="Fechas (opcionales)"
        error={errors.dates}
        hint="Déjalas vacías si el centro es permanente."
      >
        <View style={styles.row}>
          <View style={styles.flex}>
            <DateField value={startDate || null} onChange={setStartDate} placeholder="Inicio" />
          </View>
          <View style={styles.flex}>
            <DateField value={endDate || null} onChange={setEndDate} placeholder="Fin" />
          </View>
        </View>
      </Field>

      <Field label="Descripción (opcional)">
        <Input
          variant="filled"
          value={description}
          onChangeText={setDescription}
          placeholder="Qué se recibe en este centro"
          multiline
          style={styles.multiline}
        />
      </Field>

      <Field label="Horario (opcional)">
        <Input
          variant="filled"
          value={schedule}
          onChangeText={setSchedule}
          placeholder="Ej. Lun a Vie 9:00-17:00"
        />
      </Field>

      <Field label="Teléfono de contacto (opcional)">
        <Input
          variant="filled"
          value={phone}
          onChangeText={setPhone}
          placeholder="33 1234 5678"
          keyboardType="phone-pad"
        />
      </Field>

      {errors.submit && <Text style={styles.submitError}>{errors.submit}</Text>}
      <Button title="Publicar centro" onPress={submit} loading={isSubmitting} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  // minWidth 0: sin esto, en web los campos no se encogen y la fila se sale de la pantalla.
  flex: { flex: 1, minWidth: 0 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  submitError: { color: colors.danger, textAlign: 'center' },
});
