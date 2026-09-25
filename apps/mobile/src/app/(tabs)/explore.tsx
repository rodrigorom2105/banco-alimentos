import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ExploreList,
  ExploreMap,
  VIEW_TOGGLE_HEIGHT,
  ViewToggle,
  useExploreCampaigns,
  type ExploreView,
} from '@/features/explore';
import { colors, shadows, spacing } from '@/shared/theme';

// Sin encabezado: el mapa ocupa toda la pantalla y el selector flota encima. En la lista,
// el selector queda arriba y el resto del espacio es para los resultados.
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ExploreView>('map');
  const { items, isLoading, isRefreshing, error, refresh, location, locate } =
    useExploreCampaigns();

  const openCampaign = (id: string) => router.push({ pathname: '/campaign/[id]', params: { id } });

  const toggleTop = insets.top + spacing.sm;
  const isMap = view === 'map';

  return (
    <View style={styles.container}>
      {isMap ? null : <View style={{ height: toggleTop + VIEW_TOGGLE_HEIGHT + spacing.sm }} />}

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : isMap ? (
        <ExploreMap
          campaigns={items}
          location={location}
          onLocate={locate}
          onOpenCampaign={openCampaign}
          topInset={toggleTop + VIEW_TOGGLE_HEIGHT + spacing.sm}
        />
      ) : (
        <ExploreList
          campaigns={items}
          hasLocation={location !== null}
          isRefreshing={isRefreshing}
          error={error}
          onRefresh={refresh}
          onOpenCampaign={openCampaign}
        />
      )}

      <View style={[styles.toggle, { top: toggleTop }]} pointerEvents="box-none">
        <ViewToggle value={view} onChange={setView} style={isMap && styles.floating} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toggle: { position: 'absolute', left: spacing.md, right: spacing.md },
  floating: shadows.floating,
  loading: { flex: 1 },
});
