import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Placeholder, StatusBadge } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { useMyDonations } from '../hooks/useMyDonations';
import { donationStatus, isOpen } from '../labels';
import { activePickup, type MyDonationRequest } from '../types';

function DonationRow({ donation }: { donation: MyDonationRequest }) {
  const status = donationStatus(donation.status, !!activePickup(donation)?.accepted_at);
  const products = donation.items.length;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/donation/[id]', params: { id: donation.id } })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.date}>{formatDayMonth(donation.preferred_date)}</Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      <Text style={styles.detail} numberOfLines={1}>
        {donation.address}
      </Text>
      <Text style={styles.detail}>
        {products} {products === 1 ? 'producto' : 'productos'}
        {donation.preferred_campaign ? ` · ${donation.preferred_campaign.name}` : ''}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function MyDonationList() {
  const { donations, isLoading, error, reload } = useMyDonations();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Las abiertas primero y aparte: son las que piden algo del donador (tener el donativo
  // listo). El historial es para consultar.
  const { open, history } = useMemo(
    () => ({
      open: donations.filter((d) => isOpen(d.status)),
      history: donations.filter((d) => !isOpen(d.status)),
    }),
    [donations],
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  // `rows` mezcla encabezados y solicitudes en una sola lista para que el scroll sea uno.
  const rows: ({ kind: 'title'; text: string } | { kind: 'item'; donation: MyDonationRequest })[] =
    [
      ...(open.length > 0
        ? [{ kind: 'title' as const, text: 'En curso' }, ...open.map(toItem)]
        : []),
      ...(history.length > 0
        ? [{ kind: 'title' as const, text: 'Historial' }, ...history.map(toItem)]
        : []),
    ];

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => (row.kind === 'title' ? row.text : row.donation.id)}
      renderItem={({ item: row }) =>
        row.kind === 'title' ? (
          <SectionTitle>{row.text}</SectionTitle>
        ) : (
          <DonationRow donation={row.donation} />
        )
      }
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        <Button title="+ Donar desde casa" onPress={() => router.push('/donation/new')} />
      }
      ListEmptyComponent={
        <Placeholder
          title={error ? 'No se pudieron cargar tus donaciones' : 'Todavía no has donado'}
          message={error ?? 'Cuando solicites una recolección a domicilio, va a aparecer aquí.'}
        />
      }
    />
  );
}

const toItem = (donation: MyDonationRequest) => ({ kind: 'item' as const, donation });

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary },
});
