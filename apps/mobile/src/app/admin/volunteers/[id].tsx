import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { AdminOnly, useVolunteerForReview, VolunteerReview } from '@/features/admin';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function AdminVolunteerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { volunteer, isLoading, error, reload } = useVolunteerForReview(id);

  return (
    <Screen title="Solicitud de voluntariado">
      <AdminOnly>
        {isLoading ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : !volunteer ? (
          <Placeholder
            title="Solicitud no disponible"
            message={error ?? 'No existe o ya no está disponible.'}
          />
        ) : (
          <VolunteerReview volunteer={volunteer} onChanged={reload} />
        )}
      </AdminOnly>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
