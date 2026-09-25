import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';

type Props = {
  children: ReactNode;
  // Sin título se muestra solo el botón de regreso (p. ej. en los detalles, que ya traen nombre).
  title?: string;
  showBack?: boolean;
};

// Contenedor de pantalla con encabezado propio (reemplaza la barra de navegación nativa):
// botón de regreso redondo y título grande, con el mismo estilo que el Home.
export function Screen({ children, title, showBack = true }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {(title || showBack) && (
        <View style={styles.header}>
          {showBack && (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Regresar"
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
            </Pressable>
          )}
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.6 },
  title: { flex: 1, fontSize: 24, color: colors.text },
  body: { flex: 1 },
});
