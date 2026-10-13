import { router } from 'expo-router';
import { useState } from 'react';
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

import { FilterChip, Placeholder, StatusBadge } from '@/shared/components';
import { useMunicipalities } from '@/shared/hooks';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { useVolunteersForReview } from '../hooks/useAdminQueries';
import { VOLUNTEER_STATUS } from '../labels';
import type { VolunteerForReview, VolunteerStatus } from '../types';

const FILTERS: (VolunteerStatus | null)[] = ['pending', 'approved', 'rejected', 'suspended', null];

function VolunteerRow({
  volunteer,
  municipalities,
}: {
  volunteer: VolunteerForReview;
  municipalities: string[];
}) {
  const status = VOLUNTEER_STATUS[volunteer.status];
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/admin/volunteers/[id]', params: { id: volunteer.id } })
      }
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.name} numberOfLines={1}>
          {volunteer.firstName} {volunteer.lastName}
        </Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      <Text style={styles.detail} numberOfLines={1}>
        {municipalities.length > 0 ? municipalities.join(', ') : 'Sin municipios'}
      </Text>
      <Text style={styles.detail}>
        Solicitud del {formatDayMonth(volunteer.createdAt.slice(0, 10))}
      </Text>
    </Pressable>
  );
}

export function VolunteerList() {
  const [filter, setFilter] = useState<VolunteerStatus | null>('pending');
  const { volunteers, isLoading, error, reload } = useVolunteersForReview(filter);
  const { items: allMunicipalities } = useMunicipalities();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const namesFor = (ids: number[]) =>
    allMunicipalities.filter((m) => ids.includes(m.id)).map((m) => m.name);

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <FlatList
      data={volunteers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <VolunteerRow volunteer={item} municipalities={namesFor(item.municipalityIds)} />
      )}
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((status) => (
            <FilterChip
              key={status ?? 'all'}
              label={status ? VOLUNTEER_STATUS[status].label : 'Todos'}
              selected={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </ScrollView>
      }
      ListEmptyComponent={
        <Placeholder
          title={error ? 'No se pudieron cargar los voluntarios' : 'Nada por aquí'}
          message={error ?? 'No hay voluntarios con este estado.'}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  chips: { gap: spacing.sm, marginBottom: spacing.sm },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary },
});
