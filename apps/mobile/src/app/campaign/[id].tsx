import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CampaignDetail, useCampaign } from '@/features/campaigns';
import { useUserLocation } from '@/features/explore';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';
import { distanceKm } from '@/shared/utils';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { campaign, isLoading, error } = useCampaign(id);
  const { location } = useUserLocation();

  return (
    <Screen>
      {isLoading ? (
        <ActivityIndicator style={styles.fill} color={colors.primary} />
      ) : !campaign ? (
        <Placeholder
          title="Campaña no disponible"
          message={error ?? 'Esta campaña ya no está disponible.'}
        />
      ) : (
        <SafeAreaView style={styles.fill} edges={['bottom']}>
          <CampaignDetail
            campaign={campaign}
            distanceKm={location ? distanceKm(location, campaign) : null}
          />
        </SafeAreaView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
});
