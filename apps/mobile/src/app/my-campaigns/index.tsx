import { ActivityIndicator, StyleSheet } from 'react-native';

import { ManagedCampaignList } from '@/features/campaigns';
import { useMyRoles } from '@/features/profile';
import { Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function MyCampaignsScreen() {
  // Cualquier usuario con sesión puede tener campañas propias. RLS solo le muestra las suyas;
  // los admins ven todas. Si no tiene ninguna, la lista muestra su estado vacío.
  const { isAdmin, isLoading } = useMyRoles();

  return (
    <Screen title={isAdmin ? 'Campañas' : 'Mis campañas'}>
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <ManagedCampaignList isAdmin={isAdmin} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
