import { ActivityIndicator, StyleSheet } from 'react-native';

import { ManagedCampaignList } from '@/features/campaigns';
import { useMyRoles } from '@/features/profile';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function MyCampaignsScreen() {
  const { isAdmin, isVolunteer, isLoading } = useMyRoles();

  return (
    <Screen title={isAdmin ? 'Campañas' : 'Mis campañas'}>
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !isAdmin && !isVolunteer ? (
        <Placeholder
          title="Solo para voluntarios"
          message="Para registrar y administrar campañas primero debes ser voluntario aprobado."
        />
      ) : (
        <ManagedCampaignList isAdmin={isAdmin} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
