import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { colors, radius, shadows, spacing } from '@/shared/theme';
import type { Coordinates } from '@/shared/utils';

import { matchesQuery } from '../filters';
import type { ExploreCampaign } from '../types';
import { CampaignPreviewCard } from './CampaignPreviewCard';
import { SearchBar } from './SearchBar';

// Centro de Guadalajara: se usa mientras no haya ubicación del usuario.
const DEFAULT_REGION: Region = {
  latitude: 20.6597,
  longitude: -103.3496,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};
const ZOOMED_DELTA = 0.03;
const CARD_WIDTH = 260;
const CARD_GAP = spacing.sm;

const regionAround = ({ latitude, longitude }: Coordinates): Region => ({
  latitude,
  longitude,
  latitudeDelta: ZOOMED_DELTA,
  longitudeDelta: ZOOMED_DELTA,
});

export type ExploreMapProps = {
  campaigns: ExploreCampaign[];
  location: Coordinates | null;
  onLocate: () => Promise<Coordinates | null>;
  onOpenCampaign: (id: string) => void;
  // Espacio superior ocupado por controles flotantes (selector Mapa/Lista y área segura).
  topInset?: number;
};

export function ExploreMap({
  campaigns,
  location,
  onLocate,
  onOpenCampaign,
  topInset = spacing.md,
}: ExploreMapProps) {
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList<ExploreCampaign>>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // En el mapa lo más útil es ver primero lo más cercano.
  const visible = useMemo(
    () =>
      campaigns
        .filter((c) => matchesQuery(c, query))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)),
    [campaigns, query],
  );

  // Centra el mapa en el usuario la primera vez que llega su ubicación.
  const hasCentered = useRef(false);
  useEffect(() => {
    if (location && !hasCentered.current) {
      hasCentered.current = true;
      mapRef.current?.animateToRegion(regionAround(location));
    }
  }, [location]);

  const focusCampaign = (campaign: ExploreCampaign) => {
    setSelectedId(campaign.id);
    mapRef.current?.animateToRegion(regionAround(campaign));
  };

  const handleMarkerPress = (campaign: ExploreCampaign) => {
    focusCampaign(campaign);
    const index = visible.findIndex((c) => c.id === campaign.id);
    if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
    const campaign = visible[index];
    if (campaign && campaign.id !== selectedId) focusCampaign(campaign);
  };

  const handleLocate = async () => {
    const current = location ?? (await onLocate());
    if (current) mapRef.current?.animateToRegion(regionAround(current));
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={location ? regionAround(location) : DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {visible.map((campaign) => (
          <Marker
            key={campaign.id}
            coordinate={campaign}
            title={campaign.name}
            pinColor={campaign.id === selectedId ? colors.danger : colors.primary}
            onPress={() => handleMarkerPress(campaign)}
          />
        ))}
      </MapView>

      <SearchBar value={query} onChangeText={setQuery} style={[styles.search, { top: topInset }]} />

      <Pressable
        onPress={handleLocate}
        style={styles.locateButton}
        accessibilityRole="button"
        accessibilityLabel="Centrar en mi ubicación"
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.primary} />
      </Pressable>

      <View style={styles.bottom}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay campañas que coincidan con tu búsqueda.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            horizontal
            data={visible}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.cards}
            getItemLayout={(_, index) => ({
              length: CARD_WIDTH + CARD_GAP,
              offset: (CARD_WIDTH + CARD_GAP) * index,
              index,
            })}
            onMomentumScrollEnd={handleScrollEnd}
            renderItem={({ item }) => (
              <CampaignPreviewCard
                campaign={item}
                selected={item.id === selectedId}
                onPress={() => onOpenCampaign(item.id)}
                style={styles.card}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    ...shadows.floating,
  },
  locateButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: 140,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.background,
    elevation: 4,
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: spacing.md },
  cards: { paddingHorizontal: spacing.md, gap: CARD_GAP },
  card: { width: CARD_WIDTH },
  empty: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});
