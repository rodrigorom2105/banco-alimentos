import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Button, Placeholder, StatusBadge, Text } from '@/shared/components';
import { colors } from '@/shared/theme';
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
      className="gap-2 rounded-card border border-line bg-white p-4 active:bg-carbon-50"
    >
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 font-heading text-base text-carbon-900">
          {formatDayMonth(donation.preferred_date)}
        </Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      <Text className="font-body text-[13px] text-carbon-500" numberOfLines={1}>
        {donation.address}
      </Text>
      <Text className="font-body text-[13px] text-carbon-500">
        {products} {products === 1 ? 'producto' : 'productos'}
        {donation.preferred_campaign ? ` · ${donation.preferred_campaign.name}` : ''}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="mt-2 font-heading text-lg text-carbon-900">{children}</Text>;
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

  if (isLoading) {
    return (
      <ActivityIndicator
        style={{ flex: 1, backgroundColor: colors.background }}
        color={colors.primary}
      />
    );
  }

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
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
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
