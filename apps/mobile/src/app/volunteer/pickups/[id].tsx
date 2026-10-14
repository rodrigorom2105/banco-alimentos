import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { PickupDetail, useMyPickup } from '@/features/pickups';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function PickupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pickup, isLoading, error, reload } = useMyPickup(id);

  return (
    <Screen title="Recolección">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !pickup ? (
        // La lista solo trae las propias y activas, así que esto cubre tanto una recolección
        // de otro voluntario (deep link) como una que ya se entregó o canceló.
        <Placeholder
          title="Recolección no disponible"
          message={error ?? 'Ya se entregó, se canceló, o no está asignada a ti. Revisa tu lista.'}
        />
      ) : (
        <PickupDetail pickup={pickup} onChanged={reload} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
