import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { WEEKDAY_LABELS } from '@/features/volunteers';
import { Button, PromptModal, StatusBadge, Text } from '@/shared/components';
import { useMunicipalities } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, fonts, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { adminApi } from '../api/adminApi';
import { VOLUNTEER_STATUS } from '../labels';
import type { VolunteerForReview } from '../types';
import { VolunteerDocuments } from './VolunteerDocuments';

type Props = { volunteer: VolunteerForReview; onChanged: () => void };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

// 'HH:MM:SS' → 'HH:MM'
const hour = (time: string) => time.slice(0, 5);

export function VolunteerReview({ volunteer, onChanged }: Props) {
  const { items: municipalities } = useMunicipalities();
  const [prompt, setPrompt] = useState<'reject' | 'suspend' | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = VOLUNTEER_STATUS[volunteer.status];
  const covered = municipalities
    .filter((m) => volunteer.municipalityIds.includes(m.id))
    .map((m) => m.name);

  // Aprobar y reactivar comparten el flujo: un botón que no pide nada más y recarga al
  // terminar. Lo que cambia es el endpoint y el mensaje de error.
  const run = async (task: () => Promise<unknown>, fallback: string) => {
    setIsApproving(true);
    setError(null);
    try {
      await task();
      onChanged();
    } catch (e) {
      setError(getErrorMessage(e, fallback));
    } finally {
      setIsApproving(false);
    }
  };

  const approve = () =>
    run(() => adminApi.approveVolunteer(volunteer.id), 'No se pudo aprobar la solicitud.');

  const reactivate = () =>
    run(() => adminApi.reactivateVolunteer(volunteer.id), 'No se pudo reactivar al voluntario.');

  const sendPrompt = async (reason: string) => {
    if (prompt === 'reject') await adminApi.rejectVolunteer(volunteer.id, reason);
    else await adminApi.suspendVolunteer(volunteer.id, reason);
    onChanged();
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {volunteer.firstName} {volunteer.lastName}
          </Text>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>

        <View style={styles.card}>
          <Row label="Solicitud enviada" value={formatDayMonth(volunteer.createdAt.slice(0, 10))} />
          <Row
            label="Disponibilidad"
            value={`${volunteer.availableDays.map((d) => WEEKDAY_LABELS[d]).join(', ')} · ${hour(
              volunteer.availableFrom,
            )} a ${hour(volunteer.availableTo)}`}
          />
          <Row
            label="Municipios que cubre"
            value={covered.length > 0 ? covered.join(', ') : 'Sin municipios'}
          />
        </View>

        {volunteer.phone && (
          <Button
            title={`Llamar al ${volunteer.phone}`}
            variant="outline"
            onPress={() => Linking.openURL(`tel:${volunteer.phone}`)}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          <Text style={styles.sectionHint}>
            Revisa que la fotografía corresponda a una persona identificable y que el comprobante
            esté a su nombre.
          </Text>
          <VolunteerDocuments
            photoPath={volunteer.photoPath}
            proofOfAddressPath={volunteer.proofOfAddressPath}
          />
        </View>

        {volunteer.rejectionReason && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>
              {volunteer.status === 'suspended' ? 'Motivo de la suspensión' : 'Motivo del rechazo'}
            </Text>
            <Text style={styles.noticeText}>{volunteer.rejectionReason}</Text>
          </View>
        )}

        {covered.length === 0 && volunteer.status === 'pending' && (
          <View style={[styles.notice, styles.noticeRow]}>
            <MaterialCommunityIcons name="alert-outline" size={18} color={colors.danger} />
            <Text style={styles.noticeText}>
              Esta solicitud no tiene municipios, así que no se puede aprobar: no habría forma de
              asignarle recolecciones.
            </Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {volunteer.status === 'pending' && (
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title="Rechazar" variant="outline" onPress={() => setPrompt('reject')} />
            </View>
            <View style={styles.action}>
              <Button title="Aprobar" onPress={approve} loading={isApproving} />
            </View>
          </View>
        )}

        {volunteer.status === 'approved' && (
          <Button title="Suspender" variant="outline" onPress={() => setPrompt('suspend')} />
        )}

        {/* Sin esto, suspender no tendría vuelta: aprobar solo funciona desde `pending` y la
            persona no puede reenviar su solicitud estando suspendida. */}
        {volunteer.status === 'suspended' && (
          <Button title="Reactivar voluntario" onPress={reactivate} loading={isApproving} />
        )}
      </ScrollView>

      <PromptModal
        visible={prompt !== null}
        title={prompt === 'suspend' ? 'Suspender voluntario' : 'Rechazar solicitud'}
        message={
          prompt === 'suspend'
            ? 'La persona pierde el acceso de inmediato. El motivo le llega como notificación.'
            : 'El motivo le llega como notificación, así que explícalo con claridad.'
        }
        placeholder="Ej. El comprobante de domicilio no es legible"
        submitLabel={prompt === 'suspend' ? 'Suspender' : 'Rechazar'}
        onSubmit={sendPrompt}
        onClose={() => setPrompt(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  header: { gap: spacing.sm, alignItems: 'flex-start' },
  name: { fontSize: 22, fontFamily: fonts.title, color: colors.text },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  row: { gap: 2 },
  label: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 15, color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontFamily: fonts.heading, color: colors.text },
  sectionHint: { fontSize: 13, color: colors.textSecondary },
  notice: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerTint,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noticeTitle: { fontSize: 13, fontFamily: fonts.heading, color: colors.danger },
  noticeText: { flex: 1, fontSize: 13, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  error: { color: colors.danger, textAlign: 'center' },
});
