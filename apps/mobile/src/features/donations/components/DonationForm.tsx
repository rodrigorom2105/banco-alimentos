import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMyProfile, profileApi } from '@/features/profile';
import { useAuth } from '@/providers';
import { Button, EMPTY_ADDRESS, Field, FormScreen, Input, SuccessState } from '@/shared/components';
import { useProductCategories } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';

import { donationsApi } from '../api/donationsApi';
import { useCampaignsForDonation } from '../hooks/useCampaignsForDonation';
import type { DonationDetailsDraft, DonationDetailsErrors } from '../types';
import { hasErrors, validateDonationDetails } from '../validation';
import { DonationDetailsFields, NEAREST_CENTER } from './DonationDetailsFields';
import { DonationItemRow, type DonationItemDraft } from './DonationItemRow';

const newItem = (): DonationItemDraft => ({
  key: `${Date.now()}-${Math.random()}`,
  categoryId: null,
  description: '',
  quantity: '',
  unit: 'kg',
});

const EMPTY_DETAILS: DonationDetailsDraft = {
  location: EMPTY_ADDRESS,
  campaignId: NEAREST_CENTER,
  references: '',
  date: '',
  timeFrom: '',
  timeTo: '',
  notes: '',
};

type Errors = DonationDetailsErrors & Partial<Record<'items' | 'phone' | 'submit', string>>;

export function DonationForm() {
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useMyProfile();
  const { items: categories } = useProductCategories();

  const [items, setItems] = useState<DonationItemDraft[]>([newItem()]);
  const [details, setDetails] = useState<DonationDetailsDraft>(EMPTY_DETAILS);
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
  const destinations = useCampaignsForDonation(details.location.municipalityId);
  const hasNoCampaigns =
    details.location.municipalityId !== null &&
    !destinations.isLoading &&
    destinations.campaigns.length === 0;

  const updateItem = (index: number, item: DonationItemDraft) =>
    setItems((prev) => prev.map((current, i) => (i === index ? item : current)));

  const updateDetails = (changes: Partial<DonationDetailsDraft>) =>
    setDetails((prev) => ({ ...prev, ...changes }));

  const validate = () => {
    const next: Errors = validateDonationDetails(details);
    const incomplete = items.some(
      (i) => i.categoryId === null || !i.description.trim() || !(Number(i.quantity) > 0),
    );
    if (incomplete)
      next.items = 'Completa tipo, producto y una cantidad mayor a 0 en cada producto.';
    if (needsPhone && phone.replace(/\D/g, '').length < 10)
      next.phone = 'Escribe un teléfono de 10 dígitos para que el voluntario te contacte.';
    setErrors(next);
    return !hasErrors(next);
  };

  const submit = async () => {
    if (!validate() || !user) return;
    setIsSubmitting(true);
    try {
      if (needsPhone) await profileApi.updatePhone(user.id, phone.trim());
      const requestId = await donationsApi.createRequest(
        user.id,
        {
          address: details.location.address.trim(),
          address_references: details.references.trim() || null,
          municipality_id: details.location.municipalityId!,
          latitude: details.location.latitude!,
          longitude: details.location.longitude!,
          preferred_date: details.date,
          preferred_time_from: `${details.timeFrom}:00`,
          preferred_time_to: `${details.timeTo}:00`,
          notes: details.notes.trim() || null,
          // null = que la plataforma elija el centro más cercano del municipio.
          preferred_campaign_id: details.campaignId || null,
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

      <DonationDetailsFields
        value={details}
        onChange={updateDetails}
        errors={errors}
        destinations={destinations}
      />

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
  submitError: { color: colors.danger, textAlign: 'center' },
});
