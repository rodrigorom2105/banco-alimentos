import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { CampaignForm, useManagedCampaign } from '@/features/campaigns';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function EditCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useManagedCampaign(id);

  return (
    <Screen title="Editar campaña">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !data ? (
        <Placeholder
          title="Campaña no disponible"
          message={error ?? 'No existe o no tienes permiso para editarla.'}
        />
      ) : (
        <CampaignForm campaign={data.campaign} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
