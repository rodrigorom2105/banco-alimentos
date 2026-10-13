import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useAuth } from '@/providers';
import { colors, radius, spacing } from '@/shared/theme';

import type { WelcomeSlide } from '../../types';

type Props = {
  item: WelcomeSlide;
  isLastItem: boolean;
};

export function WelcomeItem({ item, isLastItem }: Props) {
  const { width } = useWindowDimensions();
  const { markWelcomeSeen } = useAuth();

  // Salir del carrusel por cualquiera de las tres puertas lo marca como visto, así no vuelve
  // a aparecer hasta que se cierre sesión.
  const leave = (to: 'register' | 'login' | 'explore') => {
    markWelcomeSeen();
    if (to === 'explore') router.replace('/');
    else router.push(to === 'register' ? '/register' : '/login');
  };

  return (
    <View style={[styles.container, { width }]}>
      <Image source={item.image} style={[styles.image, { width }]} contentFit="contain" />
      {isLastItem ? (
        <>
          <Pressable style={styles.button} onPress={() => leave('register')}>
            <Text style={styles.buttonText}>Crear cuenta</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => leave('explore')}>
            <Text style={styles.secondaryText}>Explorar sin cuenta</Text>
          </Pressable>
          <Text style={styles.question}>
            ¿Ya cuentas con un perfil?{' '}
            <Text style={styles.link} onPress={() => leave('login')}>
              Login
            </Text>
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { height: 300, marginBottom: spacing.lg },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, textAlign: 'center' },
  secondary: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryText: { color: colors.primary, fontSize: 16, textAlign: 'center' },
  question: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.lg },
  link: { fontSize: 16, color: colors.primary, fontWeight: 'bold' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  description: {
    fontWeight: '300',
    color: colors.textSecondary,
    paddingHorizontal: 64,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
