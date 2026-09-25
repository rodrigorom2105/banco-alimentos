import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/providers';
import {
  AddressPicker,
  Button,
  DateField,
  EMPTY_ADDRESS,
  Field,
  FormScreen,
  Input,
  Select,
  SuccessState,
  type AddressValue,
} from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, spacing } from '@/shared/theme';

import { campaignsApi } from '../api/campaignsApi';
import { CAMPAIGN_TYPE_LABELS } from '../labels';
import type { CampaignType, ManagedCampaign } from '../types';

const TYPE_OPTIONS = (Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[]).map((type) => ({
  value: type,
  label: CAMPAIGN_TYPE_LABELS[type],
}));

type Errors = Partial<Record<'name' | 'address' | 'dates' | 'phone' | 'submit', string>>;

const toAddress = (campaign: ManagedCampaign): AddressValue => ({
  address: campaign.address,
  latitude: campaign.latitude,
  longitude: campaign.longitude,
  municipalityId: campaign.municipality?.id ?? null,
});

type Props = {
  isAdmin: boolean;
  // Si viene, el formulario edita esa campaña en lugar de registrar una nueva.
  campaign?: ManagedCampaign;
};

// Los centros BAMX (institucionales) solo los crean admins; el resto registra comunitarias.
export function CampaignForm({ isAdmin, campaign }: Props) {
  const { user } = useAuth();
  const isEditing = !!campaign;
  const [name, setName] = useState(campaign?.name ?? '');
  const [type, setType] = useState<CampaignType>(campaign?.type ?? 'community');
  const [location, setLocation] = useState<AddressValue>(
    campaign ? toAddress(campaign) : EMPTY_ADDRESS,
  );
  // Fechas en formato 'YYYY-MM-DD'; cadena vacía = sin fecha.
  const [startDate, setStartDate] = useState(campaign?.start_date ?? '');
  const [endDate, setEndDate] = useState(campaign?.end_date ?? '');
  const [description, setDescription] = useState(campaign?.description ?? '');
  const [schedule, setSchedule] = useState(campaign?.schedule ?? '');
  const [phone, setPhone] = useState(campaign?.contact_phone ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const validate = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Escribe el nombre de la campaña.';
    if (!location.address.trim() || location.latitude === null || location.municipalityId === null)
      next.address = 'Indica la dirección, marca el punto en el mapa y elige el municipio.';
    const start = startDate || null;
    const end = endDate || null;
    if (type === 'community' && !start)
      next.dates = 'Las campañas comunitarias necesitan fecha de inicio.';
    else if (start && end && end < start)
      next.dates = 'La fecha de fin debe ser igual o posterior a la de inicio.';
    if (phone.replace(/\D/g, '').length < 10)
      next.phone = 'Escribe un teléfono de contacto de 10 dígitos.';
    setErrors(next);
    return Object.keys(next).length === 0 ? { start, end } : null;
  };

  const submit = async () => {
    const valid = validate();
    if (!valid || !user) return;
    setIsSubmitting(true);
    try {
      const data = {
        type,
        name: name.trim(),
        description: description.trim() || null,
        address: location.address.trim(),
        municipality_id: location.municipalityId!,
        latitude: location.latitude!,
        longitude: location.longitude!,
        start_date: valid.start,
        end_date: valid.end,
        schedule: schedule.trim() || null,
        contact_phone: phone.trim(),
      };
      if (campaign) {
        await campaignsApi.update(campaign.id, data);
        router.back();
        return;
      }
      setCreatedId(await campaignsApi.create(user.id, data));
    } catch (e) {
      setErrors({
        submit: getErrorMessage(
          e,
          isEditing ? 'No se pudieron guardar los cambios.' : 'No se pudo registrar la campaña.',
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdId) {
    const isInstitutional = type === 'institutional';
    return (
      <SuccessState
        title={isInstitutional ? 'Centro publicado' : 'Campaña registrada'}
        message={
          isInstitutional
            ? 'El centro ya aparece en Explorar.'
            : 'Quedó pendiente de revisión. BAMX la revisará y te avisaremos cuando se apruebe; mientras tanto no aparece en Explorar.'
        }
        actionLabel="Ver campaña"
        onAction={() =>
          router.replace({ pathname: '/my-campaigns/[id]', params: { id: createdId } })
        }
      />
    );
  }

  return (
    <FormScreen>
      <Field label="Nombre de la campaña" error={errors.name}>
        <Input
          variant="filled"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Campaña de Col. Chapalita"
        />
      </Field>

      <Field
        label="Tipo"
        hint={
          !isAdmin
            ? 'Los centros BAMX los registra el personal del banco.'
            : type === 'institutional'
              ? 'Los centros BAMX solo los puede publicar una cuenta con rol admin en Supabase.'
              : undefined
        }
      >
        <Select value={type} options={TYPE_OPTIONS} onChange={setType} disabled={!isAdmin} />
      </Field>

      <Field label="Ubicación">
        <AddressPicker value={location} onChange={setLocation} error={errors.address} />
      </Field>

      <Field
        label="Fechas"
        error={errors.dates}
        hint="La fecha de fin es opcional: sin ella, el punto queda como permanente."
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

      <Field label="Descripción">
        <Input
          variant="filled"
          value={description}
          onChangeText={setDescription}
          placeholder="Explica la campaña y qué artículos se recolectan"
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

      <Field label="Teléfono de contacto" error={errors.phone}>
        <Input
          variant="filled"
          value={phone}
          onChangeText={setPhone}
          placeholder="33 1234 5678"
          keyboardType="phone-pad"
        />
      </Field>

      {errors.submit && <Text style={styles.submitError}>{errors.submit}</Text>}
      <Button
        title={
          isEditing
            ? 'Guardar cambios'
            : type === 'institutional'
              ? 'Publicar centro'
              : 'Enviar a revisión'
        }
        onPress={submit}
        loading={isSubmitting}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  // minWidth 0: sin esto, en web los TextInput no se encogen y la fila se sale de la pantalla.
  flex: { flex: 1, minWidth: 0 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  submitError: { color: colors.danger, textAlign: 'center' },
});
