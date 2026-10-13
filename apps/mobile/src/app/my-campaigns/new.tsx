import { ActivityIndicator, StyleSheet } from 'react-native';

import { CampaignForm } from '@/features/campaigns';
import { useMyRoles } from '@/features/profile';
import { Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function NewCampaignScreen() {
  // Cualquier usuario con sesión puede registrar una campaña; la revisión del admin es la que
  // valida (decisión 3 del plan). El rol solo sirve para saber si el formulario va en modo admin.
  const { isAdmin, isLoading } = useMyRoles();

  return (
    <Screen title="Nueva campaña">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <CampaignForm isAdmin={isAdmin} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
