import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Placeholder, StatusBadge } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, fonts, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { adminApi } from '../api/adminApi';
import { useUnassignedDonations } from '../hooks/useAdminQueries';
import type { UnassignedDonation } from '../types';

const hour = (time: string) => time.slice(0, 5);

type RowProps = { donation: UnassignedDonation; busy: boolean; onRetry: () => void };

function DonationRow({ donation, busy, onRetry }: RowProps) {
  // Dos situaciones distintas: nadie la tomó nunca, o alguien la dejó sin contestar.
  const stale = donation.offer !== null;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.date}>{formatDayMonth(donation.preferredDate)}</Text>
        <StatusBadge
          label={stale ? 'Propuesta vencida' : 'Sin voluntario'}
          tone={stale ? 'warning' : 'danger'}
        />
      </View>
      <Text style={styles.detail}>
        {donation.donorName} · {donation.municipalityName}
      </Text>
      <Text style={styles.detail} numberOfLines={1}>
        {donation.address}
      </Text>
      <Text style={styles.detail}>
        {hour(donation.preferredTimeFrom)} a {hour(donation.preferredTimeTo)} ·{' '}
        {donation.itemsCount} {donation.itemsCount === 1 ? 'producto' : 'productos'}
      </Text>

      {stale && (
        <Text style={styles.stale}>
          Se le propuso a {donation.offer!.volunteerName} y no respondió. Al reintentar, la
          propuesta se cancela y se le ofrece a alguien más.
        </Text>
      )}

      <Button title="Reintentar asignación" onPress={onRetry} loading={busy} />
    </View>
  );
}

/**
 * Donaciones que la plataforma no pudo asignar sola.
 *
 * Reintentar no es un botón de "por si acaso": las condiciones cambian (un voluntario nuevo
 * aprobado, otro que liberó su día, un punto de acopio que volvió a activarse), así que el
 * mismo cálculo puede dar un resultado distinto más tarde.
 */
export function UnassignedDonationList() {
  const { donations, isLoading, error, reload } = useUnassignedDonations();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const retry = async (donation: UnassignedDonation) => {
    setBusyId(donation.id);
    setActionError(null);
    setMessage(null);
    try {
      const result = await adminApi.assignDonation(donation.id);
      setMessage(
        result.assigned
          ? `Se le propuso a ${result.volunteerName}. Queda pendiente de que confirme.`
          : 'Sigue sin haber un voluntario disponible que cubra esa zona, día y horario.',
      );
      await reload();
    } catch (e) {
      setActionError(getErrorMessage(e, 'No se pudo reintentar la asignación.'));
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <FlatList
      data={donations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <DonationRow donation={item} busy={busyId === item.id} onRetry={() => retry(item)} />
      )}
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        message || actionError ? (
          <View style={styles.header}>
            {message && <Text style={styles.message}>{message}</Text>}
            {actionError && <Text style={styles.error}>{actionError}</Text>}
          </View>
        ) : null
      }
      ListEmptyComponent={
        <Placeholder
          title={error ? 'No se pudieron cargar las donaciones' : 'Todo asignado'}
          message={
            error ?? 'Todas las donaciones a domicilio tienen un voluntario propuesto o confirmado.'
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { flex: 1, fontSize: 16, fontFamily: fonts.heading, color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary },
  stale: { fontSize: 13, color: colors.text, marginTop: spacing.xs },
  message: { fontSize: 13, color: colors.primary },
  error: { fontSize: 13, color: colors.danger },
});
