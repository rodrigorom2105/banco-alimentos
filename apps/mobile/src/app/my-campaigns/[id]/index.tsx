import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManageCampaign, useManagedCampaign } from '@/features/campaigns';
import { useMyRoles } from '@/features/profile';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function ManageCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, reload } = useManagedCampaign(id);
  const { isAdmin, isLoading: isLoadingRoles } = useMyRoles();

  // Sin título: la pantalla ya muestra el nombre de la campaña en grande.
  return (
    <Screen>
      {isLoading || isLoadingRoles ? (
        <ActivityIndicator style={styles.fill} color={colors.primary} />
      ) : !data ? (
        <Placeholder
          title="Campaña no disponible"
          message={error ?? 'No existe o no tienes permiso para administrarla.'}
        />
      ) : (
        <SafeAreaView style={styles.fill} edges={['bottom']}>
          <ManageCampaign
            campaign={data.campaign}
            supportRequests={data.supportRequests}
            isAdmin={isAdmin}
            onChanged={reload}
          />
        </SafeAreaView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
});
