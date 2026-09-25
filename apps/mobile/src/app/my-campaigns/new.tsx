import { ActivityIndicator, StyleSheet } from 'react-native';

import { CampaignForm } from '@/features/campaigns';
import { useMyRoles } from '@/features/profile';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function NewCampaignScreen() {
  const { isAdmin, isVolunteer, isLoading } = useMyRoles();

  return (
    <Screen title="Nueva campaña">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !isAdmin && !isVolunteer ? (
        <Placeholder
          title="Solo para voluntarios"
          message="Para registrar una campaña primero debes ser voluntario aprobado."
        />
      ) : (
        <CampaignForm isAdmin={isAdmin} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
