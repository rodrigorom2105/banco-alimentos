import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, FormScreen, Text } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';

import { donationsApi } from '../api/donationsApi';
import { useCampaignsForDonation } from '../hooks/useCampaignsForDonation';
import {
  activePickup,
  type DonationDetailsDraft,
  type DonationDetailsErrors,
  type MyDonationRequest,
} from '../types';
import { hasErrors, validateDonationDetails } from '../validation';
import { DonationDetailsFields, NEAREST_CENTER } from './DonationDetailsFields';

// La solicitud guardada, en forma de borrador editable. Las horas vienen como 'HH:MM:SS' de la
// base y los campos de hora trabajan con 'HH:MM'.
const draftFrom = (donation: MyDonationRequest): DonationDetailsDraft => ({
  location: {
    address: donation.address,
    latitude: donation.latitude,
    longitude: donation.longitude,
    municipalityId: donation.municipality_id,
  },
  campaignId: donation.preferred_campaign_id ?? NEAREST_CENTER,
  references: donation.address_references ?? '',
  date: donation.preferred_date,
  timeFrom: donation.preferred_time_from.slice(0, 5),
  timeTo: donation.preferred_time_to.slice(0, 5),
  notes: donation.notes ?? '',
});

/**
 * Corregir una solicitud abierta.
 *
 * No se editan los productos: eso es otra pantalla y otra regla (la base deja cambiarlos solo
 * mientras la solicitud esté `pending`). Aquí van los datos de la recolección, que es lo que
 * suele cambiar: "ya no puedo el jueves", "me equivoqué en la calle".
 */
export function DonationEditForm({ donation }: { donation: MyDonationRequest }) {
  const [details, setDetails] = useState<DonationDetailsDraft>(draftFrom(donation));
  // Vacíos al abrir: lo guardado ya era válido, y señalar errores en campos que el usuario no
  // ha tocado solo lo asusta.
  const [errors, setErrors] = useState<DonationDetailsErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destinations = useCampaignsForDonation(details.location.municipalityId);
  const hasNoCampaigns =
    details.location.municipalityId !== null &&
    !destinations.isLoading &&
    destinations.campaigns.length === 0;

  // Si ya hay una propuesta sin confirmar, cambiar el día, el horario o dónde se recoge se la
  // retira a ese voluntario y busca a otro. Vale avisarlo antes, no después.
  const pickup = activePickup(donation);
  const warnsAboutReassignment = !!pickup && !pickup.accepted_at;

  const updateDetails = (changes: Partial<DonationDetailsDraft>) => {
    setDetails((prev) => ({ ...prev, ...changes }));
    setSubmitError(null);
  };

  const submit = async () => {
    const found = validateDonationDetails(details);
    setErrors(found);
    setSubmitError(null);
    if (hasErrors(found)) return;

    setIsSubmitting(true);
    try {
      await donationsApi.updateDetails(donation.id, {
        address: details.location.address.trim(),
        addressReferences: details.references.trim() || null,
        municipalityId: details.location.municipalityId!,
        latitude: details.location.latitude!,
        longitude: details.location.longitude!,
        preferredDate: details.date,
        preferredTimeFrom: `${details.timeFrom}:00`,
        preferredTimeTo: `${details.timeTo}:00`,
        notes: details.notes.trim() || null,
        preferredCampaignId: details.campaignId || null,
      });
      // El detalle recarga al recibir el foco (useFocusQuery), así que ya muestra lo nuevo.
      router.back();
    } catch (e) {
      setSubmitError(getErrorMessage(e, 'No se pudieron guardar los cambios.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormScreen>
      {warnsAboutReassignment && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Ya le propusimos tu donativo a un voluntario. Si cambias el día, el horario o el
            domicilio, buscaremos a quien le quede mejor con los datos nuevos.
          </Text>
        </View>
      )}

      <DonationDetailsFields
        value={details}
        onChange={updateDetails}
        errors={errors}
        destinations={destinations}
      />

      {submitError && <Text style={styles.submitError}>{submitError}</Text>}
      <Button
        title="Guardar cambios"
        onPress={submit}
        loading={isSubmitting}
        disabled={hasNoCampaigns}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningTint },
  noticeText: { fontSize: 13, lineHeight: 19, color: colors.text },
  submitError: { color: colors.danger, textAlign: 'center' },
});
