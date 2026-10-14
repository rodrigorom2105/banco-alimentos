import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMyProfile, profileApi } from '@/features/profile';
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
import { useProductCategories } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';
import { parseDate, todayISO } from '@/shared/utils';

import { donationsApi } from '../api/donationsApi';
import { useCampaignsForDonation } from '../hooks/useCampaignsForDonation';
import { DonationItemRow, type DonationItemDraft } from './DonationItemRow';

// Primera opción del selector: la plataforma asigna el centro más cercano del municipio.
// Guarda `preferred_campaign_id` en null. El texto describe el resultado ("el más cercano")
// en lugar de quién decide: para el donador lo importante es que su donativo llega al punto
// que menos traslado implica, no quién lo eligió.
const NEAREST_CENTER = '';

const newItem = (): DonationItemDraft => ({
  key: `${Date.now()}-${Math.random()}`,
  categoryId: null,
  description: '',
  quantity: '',
  unit: 'kg',
});

type Errors = Partial<Record<'items' | 'address' | 'date' | 'time' | 'phone' | 'submit', string>>;

export function DonationForm() {
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useMyProfile();
  const { items: categories } = useProductCategories();

  const [items, setItems] = useState<DonationItemDraft[]>([newItem()]);
  const [location, setLocation] = useState<AddressValue>(EMPTY_ADDRESS);
  const [campaignId, setCampaignId] = useState(NEAREST_CENTER);
  const [references, setReferences] = useState('');
  const [date, setDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  // Si la plataforma encontró voluntario de inmediato, para que el mensaje final no prometa
  // algo distinto a lo que pasó.
  const [isAssigned, setIsAssigned] = useState(false);

  // El esquema exige teléfono antes de crear una solicitud; si falta se pide aquí mismo.
  const needsPhone = !isLoadingProfile && !profile?.phone;

  // El donativo solo puede ir a una campaña activa de SU municipio: el voluntario que lo
  // recoja solo acepta recolecciones de sus propios municipios (decisión 9 del plan).
  const {
    campaigns,
    isLoading: isLoadingCampaigns,
    error: campaignsError,
  } = useCampaignsForDonation(location.municipalityId);
  const hasMunicipality = location.municipalityId !== null;
  const hasNoCampaigns = hasMunicipality && !isLoadingCampaigns && campaigns.length === 0;

  const updateItem = (index: number, item: DonationItemDraft) =>
    setItems((prev) => prev.map((current, i) => (i === index ? item : current)));

  // Al cambiar de municipio la campaña elegida deja de ser válida, así que se reinicia.
  const updateLocation = (next: AddressValue) => {
    if (next.municipalityId !== location.municipalityId) setCampaignId(NEAREST_CENTER);
    setLocation(next);
  };

  const validate = () => {
    const next: Errors = {};
    const incomplete = items.some(
      (i) => i.categoryId === null || !i.description.trim() || !(Number(i.quantity) > 0),
    );
    if (incomplete)
      next.items = 'Completa tipo, producto y una cantidad mayor a 0 en cada producto.';
    if (!location.address.trim() || location.latitude === null || location.municipalityId === null)
      next.address = 'Indica la dirección, marca el punto en el mapa y elige el municipio.';
    if (!date) next.date = 'Elige el día en que pueden pasar.';
    else if (date < todayISO()) next.date = 'La fecha no puede ser en el pasado.';
    if (!timeFrom || !timeTo) next.time = 'Elige el horario (desde y hasta).';
    else if (timeTo <= timeFrom) next.time = 'La hora final debe ser posterior a la inicial.';
    if (needsPhone && phone.replace(/\D/g, '').length < 10)
      next.phone = 'Escribe un teléfono de 10 dígitos para que el voluntario te contacte.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate() || !user) return;
    setIsSubmitting(true);
    try {
      if (needsPhone) await profileApi.updatePhone(user.id, phone.trim());
      const requestId = await donationsApi.createRequest(
        user.id,
        {
          address: location.address.trim(),
          address_references: references.trim() || null,
          municipality_id: location.municipalityId!,
          latitude: location.latitude!,
          longitude: location.longitude!,
          preferred_date: date,
          preferred_time_from: `${timeFrom}:00`,
          preferred_time_to: `${timeTo}:00`,
          notes: notes.trim() || null,
          // null = que la plataforma elija el centro más cercano del municipio.
          preferred_campaign_id: campaignId || null,
        },
        items.map((i) => ({
          category_id: i.categoryId!,
          description: i.description.trim(),
          quantity: Number(i.quantity),
          unit: i.unit,
        })),
      );

      /**
       * Buscar voluntario es un paso aparte, y si falla la solicitud NO se pierde.
       *
       * Decirle "no se pudo enviar" sería mentira: ya quedó guardada, y volvería a mandarla
       * duplicada. Queda `pending` y el admin la ve en "Donaciones sin voluntario", así que
       * aquí se ignora el error a propósito.
       */
      try {
        const result = await donationsApi.requestAssignment(requestId);
        setIsAssigned(result.assigned);
      } catch {
        setIsAssigned(false);
      }
      setIsDone(true);
    } catch (e) {
      setErrors({ submit: getErrorMessage(e, 'No se pudo enviar la solicitud.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <SuccessState
        title="¡Solicitud enviada!"
        message={
          isAssigned
            ? 'Ya le propusimos tu donativo a un voluntario de tu zona. Te avisamos en cuanto lo confirme; ten tu donativo empacado y listo.'
            : 'Estamos buscando un voluntario de tu zona que pueda pasar por tu donativo. Te avisamos en cuanto tengamos respuesta.'
        }
        actionLabel="Ver mis donaciones"
        onAction={() => router.replace('/donation')}
      />
    );
  }

  return (
    <FormScreen>
      <Field label="Producto(s)" error={errors.items}>
        <View style={styles.items}>
          {items.map((item, index) => (
            <DonationItemRow
              key={item.key}
              index={index}
              item={item}
              categories={categories}
              onChange={(next) => updateItem(index, next)}
              onRemove={
                items.length > 1
                  ? () => setItems((prev) => prev.filter((_, i) => i !== index))
                  : undefined
              }
            />
          ))}
          <Pressable
            onPress={() => setItems((prev) => [...prev, newItem()])}
            style={styles.addButton}
            accessibilityRole="button"
          >
            <Text style={styles.addText}>+ Agregar alimento</Text>
          </Pressable>
        </View>
      </Field>

      <Field label="Ubicación">
        <AddressPicker value={location} onChange={updateLocation} error={errors.address} />
        <Input
          variant="filled"
          value={references}
          onChangeText={setReferences}
          placeholder="Referencias (ej. entre calles, portón azul)"
        />
      </Field>

      {hasMunicipality && (
        <Field
          label="¿A qué campaña quieres donar?"
          error={campaignsError ?? undefined}
          hint={
            hasNoCampaigns
              ? undefined
              : 'Solo se muestran los centros y campañas activos de tu municipio, porque el voluntario recoge dentro de su zona.'
          }
        >
          {hasNoCampaigns ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Por el momento no contamos con un punto de acopio activo en tu municipio para
                recibir tu donativo. Puedes intentarlo más adelante o consultar los puntos
                disponibles en Explorar. Agradecemos tu disposición para apoyar.
              </Text>
            </View>
          ) : (
            <Select
              value={campaignId}
              onChange={setCampaignId}
              disabled={isLoadingCampaigns}
              options={[
                { value: NEAREST_CENTER, label: 'El centro más cercano a mi domicilio' },
                ...campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name })),
              ]}
            />
          )}
        </Field>
      )}

      <Field label="¿Cuándo pueden pasar?" error={errors.date ?? errors.time}>
        <DateField
          value={date || null}
          onChange={setDate}
          placeholder="Fecha"
          minimumDate={parseDate(todayISO())}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={timeFrom || null}
              onChange={setTimeFrom}
              placeholder="Desde"
            />
          </View>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={timeTo || null}
              onChange={setTimeTo}
              placeholder="Hasta"
            />
          </View>
        </View>
      </Field>

      {needsPhone && (
        <Field label="Teléfono" error={errors.phone} hint="Se guarda en tu perfil.">
          <Input
            variant="filled"
            value={phone}
            onChangeText={setPhone}
            placeholder="33 1234 5678"
            keyboardType="phone-pad"
          />
        </Field>
      )}

      <Field label="Notas (opcional)">
        <Input
          variant="filled"
          value={notes}
          onChangeText={setNotes}
          placeholder="Algo que deba saber el voluntario"
          multiline
          style={styles.multiline}
        />
      </Field>

      {errors.submit && <Text style={styles.submitError}>{errors.submit}</Text>}
      {/* Sin centros activos en el municipio no hay destino posible, así que la base
          rechazaría la recolección más adelante: mejor no dejar enviar. */}
      <Button title="Enviar" onPress={submit} loading={isSubmitting} disabled={hasNoCampaigns} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  items: { gap: spacing.sm },
  addButton: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
  },
  addText: { color: colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm },
  // minWidth 0: sin esto, en web los campos no se encogen y la fila se sale de la pantalla.
  flex: { flex: 1, minWidth: 0 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningTint },
  noticeText: { fontSize: 13, lineHeight: 19, color: colors.text },
  submitError: { color: colors.danger, textAlign: 'center' },
});
