import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { useMyApplication, VolunteerStatusView } from '@/features/volunteers';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function VolunteerDashboardScreen() {
  const { application, isLoading, error } = useMyApplication();

  return (
    <Screen title="Mi voluntariado">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !application ? (
        // No debería pasar: Ayudar solo muestra "Mi voluntariado" si hay solicitud. Si alguien
        // llega por un deep link, se le explica en lugar de dejarlo en una pantalla vacía.
        <Placeholder
          title="Todavía no has solicitado ser voluntario"
          message={error ?? 'Puedes registrarte desde Ayudar > Ser voluntario.'}
        />
      ) : (
        <VolunteerStatusView
          application={application}
          onResubmit={() => router.push('/volunteer/apply')}
          onEditAvailability={() => router.push('/volunteer/availability')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
