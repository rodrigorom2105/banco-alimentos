import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';

export function SignupSuccess({ email }: { email?: string }) {
  return (
    <View style={styles.card}>
      <Image source={require('@/assets/images/auth/success.png')} style={styles.image} contentFit="contain" />
      <Text style={styles.title}>¡Tu cuenta fue creada!</Text>
      <Text style={styles.description}>
        Te enviamos un correo{email ? ` a ${email}` : ''} para confirmar tu cuenta. Ábrelo y después
        inicia sesión.
      </Text>
      <Button title="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    elevation: 5,
  },
  image: { width: '100%', aspectRatio: 350 / 300, borderRadius: 50, marginBottom: spacing.lg },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
