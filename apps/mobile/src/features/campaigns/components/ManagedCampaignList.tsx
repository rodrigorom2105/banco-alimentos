import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { useAuth } from '@/providers';
import { Button, FilterChip, StatusBadge, Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { statusFiltersFor, type StatusFilter } from '../filters';
import { useManagedCampaigns } from '../hooks/useManagedCampaigns';
import { CAMPAIGN_STATUS } from '../labels';
import type { ManagedCampaign } from '../types';

function CampaignRow({ campaign }: { campaign: ManagedCampaign }) {
  const status = CAMPAIGN_STATUS[campaign.status];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/my-campaigns/[id]', params: { id: campaign.id } })}
      className="gap-2 rounded-card border border-line bg-white p-4 active:bg-carbon-50"
      accessibilityRole="button"
    >
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 font-heading text-base text-carbon-900" numberOfLines={1}>
          {campaign.name}
        </Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      <Text className="font-body text-[13px] text-carbon-500" numberOfLines={1}>
        {[campaign.address, campaign.municipality?.name].filter(Boolean).join(', ')}
      </Text>
      {campaign.end_date && (
        <Text className="font-body text-[13px] text-carbon-500">
          Hasta {formatDayMonth(campaign.end_date)}
        </Text>
      )}
    </Pressable>
  );
}

export function ManagedCampaignList({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const { campaigns, isLoading, error, reload } = useManagedCampaigns(
    isAdmin ? null : (user?.id ?? null),
    !!user,
  );
  // El admin abre en su bandeja de pendientes; el organizador, en todas las suyas.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(isAdmin ? 'pending' : null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filters = useMemo(() => statusFiltersFor(campaigns, isAdmin), [campaigns, isAdmin]);
  // Si el estado seleccionado desaparece (p. ej. se aprobó la única campaña pendiente), se
  // cae a "Todas" en vez de mostrar una lista vacía con un chip que ya no existe.
  const activeFilter = filters.includes(statusFilter) ? statusFilter : null;

  const visible = useMemo(
    () => (activeFilter ? campaigns.filter((c) => c.status === activeFilter) : campaigns),
    [campaigns, activeFilter],
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

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CampaignRow campaign={item} />}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        <View className="mb-2 gap-4">
          <Button title="+ Registrar campaña" onPress={() => router.push('/my-campaigns/new')} />
          {filters.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {filters.map((status) => (
                <FilterChip
                  key={status ?? 'all'}
                  label={status ? CAMPAIGN_STATUS[status].label : 'Todas'}
                  selected={activeFilter === status}
                  onPress={() => setStatusFilter(status)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      }
      ListEmptyComponent={
        <View className="items-center gap-3 py-12">
          <MaterialCommunityIcons name="bullhorn-outline" size={48} color={colors.textSecondary} />
          <Text className="px-8 text-center font-body text-base text-carbon-500">
            {error
              ? `No se pudieron cargar las campañas: ${error}`
              : activeFilter
                ? 'No hay campañas con este estado.'
                : isAdmin
                  ? 'Todavía no hay campañas registradas.'
                  : 'Aún no has registrado ninguna campaña.'}
          </Text>
        </View>
      }
    />
  );
}
