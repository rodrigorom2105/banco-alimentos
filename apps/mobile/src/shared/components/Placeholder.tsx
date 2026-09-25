import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';

// Pantalla informativa para rutas sin contenido todavía o sin permiso.
export function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="information-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  message: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
