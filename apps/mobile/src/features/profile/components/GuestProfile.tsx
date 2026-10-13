import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';

// Vista de "Mi cuenta" para quien entró sin sesión.
export function GuestProfile() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Aún no tienes sesión</Text>
      <Text style={styles.message}>
        Puedes explorar las campañas sin cuenta. Inicia sesión para donar desde casa, registrar una
        campaña o ser voluntario.
      </Text>
      <Button title="Iniciar sesión" onPress={() => router.push('/login')} />
      <Button title="Crear cuenta" variant="outline" onPress={() => router.push('/register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  message: { fontSize: 14, color: colors.textSecondary },
});
