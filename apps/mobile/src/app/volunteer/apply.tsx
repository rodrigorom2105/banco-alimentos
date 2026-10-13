import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useMyApplication, VolunteerForm } from '@/features/volunteers';
import { Button, Placeholder, Screen } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

export default function VolunteerApplyScreen() {
  const { application, isLoading } = useMyApplication();

  return (
    <Screen title="Ser voluntario">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : application ? (
        // Solo puede existir una solicitud por usuario (user_id es UNIQUE). Si ya la envió,
        // su estado se ve en "Mi voluntariado" (Fase 6).
        <View style={styles.existing}>
          <Placeholder
            title="Ya enviaste tu solicitud"
            message="Puedes seguir su estado en Ayudar > Mi voluntariado."
          />
          <Button
            title="Ir a Mi voluntariado"
            onPress={() => router.replace('/volunteer/dashboard')}
          />
        </View>
      ) : (
        <VolunteerForm />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  existing: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
});
