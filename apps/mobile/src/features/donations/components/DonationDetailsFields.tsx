import { StyleSheet, View } from 'react-native';

import {
  AddressPicker,
  type AddressValue,
  DateField,
  Field,
  Input,
  Select,
  Text,
} from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { parseDate, todayISO } from '@/shared/utils';

import type { DonationDetailsDraft, DonationDetailsErrors, Destinations } from '../types';

/**
 * Primera opción del selector: la plataforma asigna el centro más cercano del municipio.
 * Guarda `preferred_campaign_id` en null. El texto describe el resultado ("el más cercano") en
 * lugar de quién decide: para el donador lo importante es que su donativo llega al punto que
 * menos traslado implica, no quién lo eligió.
 */
export const NEAREST_CENTER = '';

type Props = {
  value: DonationDetailsDraft;
  onChange: (changes: Partial<DonationDetailsDraft>) => void;
  errors: DonationDetailsErrors;
  /**
   * Los puntos de acopio del municipio los carga el formulario, no este componente.
   *
   * Es a propósito: quien dibuja los campos no puede decidir si el botón de enviar va
   * deshabilitado, y avisárselo al padre desde el render sería un efecto secundario que React
   * convierte en un ciclo de renders. Con los datos arriba, el padre ya sabe lo que necesita.
   */
  destinations: Destinations;
};

/**
 * Dónde, cuándo y a qué punto de acopio: los datos de la recolección.
 *
 * Están aquí y no dentro de cada formulario porque se piden al crear la solicitud y al
 * corregirla. Escribirlos dos veces garantizaba que tarde o temprano uno validara algo que el
 * otro no, o que el selector de campaña se reiniciara en un lado y no en el otro.
 */
export function DonationDetailsFields({ value, onChange, errors, destinations }: Props) {
  const { campaigns, isLoading: isLoadingCampaigns, error: campaignsError } = destinations;

  const hasMunicipality = value.location.municipalityId !== null;
  const hasNoCampaigns = hasMunicipality && !isLoadingCampaigns && campaigns.length === 0;

  // Al cambiar de municipio la campaña elegida deja de ser válida (la base exige que sea del
  // mismo municipio), así que se reinicia.
  const updateLocation = (next: AddressValue) => {
    const changed = next.municipalityId !== value.location.municipalityId;
    onChange({ location: next, ...(changed ? { campaignId: NEAREST_CENTER } : {}) });
  };

  return (
    <>
      <Field label="Ubicación">
        <AddressPicker value={value.location} onChange={updateLocation} error={errors.address} />
        <Input
          variant="filled"
          value={value.references}
          onChangeText={(references) => onChange({ references })}
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
              value={value.campaignId}
              onChange={(campaignId) => onChange({ campaignId })}
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
          value={value.date || null}
          onChange={(date) => onChange({ date })}
          placeholder="Fecha"
          minimumDate={parseDate(todayISO())}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={value.timeFrom || null}
              onChange={(timeFrom) => onChange({ timeFrom })}
              placeholder="Desde"
            />
          </View>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={value.timeTo || null}
              onChange={(timeTo) => onChange({ timeTo })}
              placeholder="Hasta"
            />
          </View>
        </View>
      </Field>

      <Field label="Notas (opcional)">
        <Input
          variant="filled"
          value={value.notes}
          onChangeText={(notes) => onChange({ notes })}
          placeholder="Algo que deba saber el voluntario"
          multiline
          style={styles.multiline}
        />
      </Field>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  // minWidth 0: sin esto, en web los campos no se encogen y la fila se sale de la pantalla.
  flex: { flex: 1, minWidth: 0 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningTint },
  noticeText: { fontSize: 13, lineHeight: 19, color: colors.text },
});
