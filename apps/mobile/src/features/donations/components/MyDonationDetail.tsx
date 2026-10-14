import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, PromptModal, StatusBadge } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { donationsApi } from '../api/donationsApi';
import { DONATION_STATUS, isOpen, ITEM_UNIT_LABELS } from '../labels';
import type { MyDonationRequest } from '../types';

type Props = { donation: MyDonationRequest; onChanged: () => void };

const hour = (time: string) => time.slice(0, 5);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function MyDonationDetail({ donation, onChanged }: Props) {
  const [isCancelling, setIsCancelling] = useState(false);
  const status = DONATION_STATUS[donation.status];

  const cancel = async (reason: string) => {
    await donationsApi.cancel(donation.id, reason);
    onChanged();
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <StatusBadge label={status.label} tone={status.tone} />
          {!!status.hint && <Text style={styles.hint}>{status.hint}</Text>}
        </View>

        {donation.status === 'cancelled' && donation.cancellation_reason && (
          <View style={styles.notice}>
            <Text style={styles.label}>Motivo de la cancelación</Text>
            <Text style={styles.value}>{donation.cancellation_reason}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Row label="Fecha de recolección" value={formatDayMonth(donation.preferred_date)} />
          <Row
            label="Horario"
            value={`${hour(donation.preferred_time_from)} a ${hour(donation.preferred_time_to)}`}
          />
          <Row
            label="Domicilio"
            value={[donation.address, donation.municipality?.name].filter(Boolean).join(', ')}
          />
          {donation.address_references && (
            <Row label="Referencias" value={donation.address_references} />
          )}
          <Row
            label="Destino"
            value={
              donation.preferred_campaign?.name ?? 'El punto de acopio más cercano a tu domicilio'
            }
          />
          {donation.notes && <Row label="Notas" value={donation.notes} />}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Productos</Text>
          {donation.items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.value}>
                {item.description}
                {item.category ? ` · ${item.category.name}` : ''}
              </Text>
              <Text style={styles.label}>
                {item.quantity} {ITEM_UNIT_LABELS[item.unit]}
                {/* Lo que el voluntario registró de verdad al recoger, si ya pasó. */}
                {item.collected_quantity !== null &&
                  ` · recolectado: ${item.collected_quantity} ${ITEM_UNIT_LABELS[item.unit]}`}
              </Text>
            </View>
          ))}
        </View>

        {isOpen(donation.status) && (
          <Button
            title="Cancelar solicitud"
            variant="outline"
            onPress={() => setIsCancelling(true)}
          />
        )}

        {donation.status === 'completed' && (
          <Button title="Donar otra vez" onPress={() => router.push('/donation/new')} />
        )}
      </ScrollView>

      <PromptModal
        visible={isCancelling}
        title="Cancelar solicitud"
        message={
          donation.status === 'assigned'
            ? 'Ya hay un voluntario asignado: se le avisará que la recolección se canceló.'
            : 'La solicitud dejará de buscar voluntario.'
        }
        placeholder="Ej. Ya entregué el donativo en un centro de acopio"
        submitLabel="Cancelar solicitud"
        onSubmit={cancel}
        onClose={() => setIsCancelling(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  header: { gap: spacing.sm, alignItems: 'flex-start' },
  hint: { fontSize: 14, color: colors.textSecondary },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  notice: { gap: 2, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  row: { gap: 2 },
  label: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 15, color: colors.text },
});
