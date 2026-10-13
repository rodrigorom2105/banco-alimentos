import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/providers';
import { Button, FilterChip, StatusBadge } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
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
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowName} numberOfLines={1}>
          {campaign.name}
        </Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      <Text style={styles.rowDetail} numberOfLines={1}>
        {[campaign.address, campaign.municipality?.name].filter(Boolean).join(', ')}
      </Text>
      {campaign.end_date && (
        <Text style={styles.rowDetail}>Hasta {formatDayMonth(campaign.end_date)}</Text>
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

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CampaignRow campaign={item} />}
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Button title="+ Registrar campaña" onPress={() => router.push('/my-campaigns/new')} />
          {filters.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
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
        <Text style={styles.empty}>
          {error
            ? `No se pudieron cargar las campañas: ${error}`
            : activeFilter
              ? 'No hay campañas con este estado.'
              : isAdmin
                ? 'Todavía no hay campañas registradas.'
                : 'Aún no has registrado ninguna campaña.'}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.background },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  chips: { gap: spacing.sm },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.7 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  rowDetail: { fontSize: 13, color: colors.textSecondary },
  empty: { paddingVertical: spacing.xl, color: colors.textSecondary, textAlign: 'center' },
});
