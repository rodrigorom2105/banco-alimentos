import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CAMPAIGN_TYPE_LABELS, type CampaignType } from '@/features/campaigns';
import { FilterChip } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { applyFilters, type ExploreFilters } from '../filters';
import type { ExploreCampaign, SortOption } from '../types';
import { CampaignPreviewCard } from './CampaignPreviewCard';
import { SearchBar } from './SearchBar';

const SORT_OPTIONS: { value: SortOption; label: string; needsLocation?: boolean }[] = [
  { value: 'nearest', label: 'Más cercana', needsLocation: true },
  { value: 'farthest', label: 'Más lejana', needsLocation: true },
  { value: 'opening', label: 'Fecha de apertura' },
  { value: 'closing', label: 'Fecha de cierre' },
];

const TYPES = Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[];

type Props = {
  campaigns: ExploreCampaign[];
  hasLocation: boolean;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenCampaign: (id: string) => void;
};

function FilterRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-heading text-xs uppercase tracking-wide text-carbon-500">{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function ExploreList({
  campaigns,
  hasLocation,
  isRefreshing,
  error,
  onRefresh,
  onOpenCampaign,
}: Props) {
  const [filters, setFilters] = useState<ExploreFilters>({
    query: '',
    sort: 'nearest',
    municipalityId: null,
    type: null,
  });
  const update = (patch: Partial<ExploreFilters>) => setFilters((prev) => ({ ...prev, ...patch }));

  // Solo se ofrecen los municipios que tienen campañas visibles.
  const municipalities = useMemo(() => {
    const byId = new Map<number, string>();
    campaigns.forEach((c) => c.municipality && byId.set(c.municipality.id, c.municipality.name));
    return [...byId]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [campaigns]);

  // Sin ubicación no se puede ordenar por distancia; se cae a fecha de cierre.
  const needsLocation = SORT_OPTIONS.find((o) => o.value === filters.sort)?.needsLocation;
  const sort: SortOption = !hasLocation && needsLocation ? 'closing' : filters.sort;
  const results = useMemo(
    () => applyFilters(campaigns, { ...filters, sort }),
    [campaigns, filters, sort],
  );

  const header = (
    <View className="mb-2 gap-4">
      <SearchBar
        value={filters.query}
        onChangeText={(query) => update({ query })}
        placeholder="Buscar por nombre"
      />
      <FilterRow title="Ordenar por">
        {SORT_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={sort === option.value}
            disabled={option.needsLocation && !hasLocation}
            onPress={() => update({ sort: option.value })}
          />
        ))}
      </FilterRow>
      <FilterRow title="Tipo">
        <FilterChip
          label="Todas"
          selected={filters.type === null}
          onPress={() => update({ type: null })}
        />
        {TYPES.map((type) => (
          <FilterChip
            key={type}
            label={CAMPAIGN_TYPE_LABELS[type]}
            selected={filters.type === type}
            onPress={() => update({ type })}
          />
        ))}
      </FilterRow>
      {municipalities.length > 1 && (
        <FilterRow title="Municipio">
          <FilterChip
            label="Todos"
            selected={filters.municipalityId === null}
            onPress={() => update({ municipalityId: null })}
          />
          {municipalities.map((m) => (
            <FilterChip
              key={m.id}
              label={m.name}
              selected={filters.municipalityId === m.id}
              onPress={() => update({ municipalityId: m.id })}
            />
          ))}
        </FilterRow>
      )}
      {!hasLocation && (
        <Text className="font-body text-xs text-carbon-500">
          Activa tu ubicación para ver distancias y ordenar por cercanía.
        </Text>
      )}
      <Text className="font-body-medium text-[13px] text-carbon-500">
        {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CampaignPreviewCard campaign={item} onPress={() => onOpenCampaign(item.id)} />
      )}
      ListHeaderComponent={header}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      ListEmptyComponent={
        <View className="items-center gap-3 py-12">
          <MaterialCommunityIcons
            name="map-search-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text className="px-8 text-center font-body text-base text-carbon-500">
            {error
              ? `No se pudieron cargar las campañas: ${error}`
              : 'No hay campañas que coincidan con los filtros.'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  chips: { gap: spacing.sm },
});
