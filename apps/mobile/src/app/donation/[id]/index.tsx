import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { MyDonationDetail, useMyDonation } from '@/features/donations';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function MyDonationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donation, isLoading, error, reload } = useMyDonation(id);

  return (
    <Screen title="Mi donación">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !donation ? (
        // RLS solo devuelve las solicitudes propias, así que esto también cubre el caso de
        // alguien intentando abrir la de otra persona por deep link.
        <Placeholder
          title="Solicitud no disponible"
          message={error ?? 'No existe o no tienes permiso para verla.'}
        />
      ) : (
        <MyDonationDetail donation={donation} onChanged={reload} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
