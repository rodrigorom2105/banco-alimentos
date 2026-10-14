import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { DonationEditForm, isOpen, useMyDonation } from '@/features/donations';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function EditMyDonationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donation, isLoading, error } = useMyDonation(id);

  return (
    <Screen title="Editar donación">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !donation || !isOpen(donation.status) ? (
        // Una solicitud entregada o cancelada ya no se toca, y RLS solo devuelve las propias,
        // así que esto también cubre a alguien abriendo la de otra persona por deep link.
        <Placeholder
          title="No se puede editar"
          message={
            error ?? 'Esta solicitud ya se entregó o se canceló, así que sus datos no cambian.'
          }
        />
      ) : (
        <DonationEditForm donation={donation} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
