import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';

import type { ExploreMapProps } from './ExploreMap';

// react-native-maps no tiene soporte para web; ahí solo está disponible la vista de Lista.
export function ExploreMap(_props: ExploreMapProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="map-marker-off-outline"
        size={40}
        color={colors.textSecondary}
      />
      <Text style={styles.text}>
        El mapa solo está disponible en la app móvil. Usa la vista de Lista para ver las campañas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  text: { color: colors.textSecondary, textAlign: 'center' },
});
