import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import type { WelcomeSlide } from '../../types';

type Props = {
  item: WelcomeSlide;
  isLastItem: boolean;
};

export function WelcomeItem({ item, isLastItem }: Props) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      <Image source={item.image} style={[styles.image, { width }]} contentFit="contain" />
      {isLastItem ? (
        <>
          <Link href="/register" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Crear cuenta</Text>
            </Pressable>
          </Link>
          <Text style={styles.question}>
            ¿Ya cuentas con un perfil?{' '}
            <Link href="/login" style={styles.link}>
              Login
            </Link>
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
