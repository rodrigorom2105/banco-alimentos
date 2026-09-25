import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';

import { useActiveCampaigns } from '../hooks/useActiveCampaigns';
import { CampaignCard } from './CampaignCard';

export function CampaignList() {
  const { campaigns, isLoading, isRefreshing, error, refresh } = useActiveCampaigns();

  if (isLoading) return <ActivityIndicator style={styles.center} color={colors.primary} />;

  return (
    <FlatList
      data={campaigns}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CampaignCard campaign={item} />}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />}
      ListHeaderComponent={<Text style={styles.title}>Centros y campañas activas</Text>}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {error ? `No se pudieron cargar las campañas: ${error}` : 'No hay campañas activas por ahora.'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});
