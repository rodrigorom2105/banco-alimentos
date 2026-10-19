import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients } from '@/shared/theme';

type Props = {
  children: ReactNode;
  // En el último paso de recuperar contraseña no hay a dónde volver: el código ya se usó.
  showBack?: boolean;
};

// Fondo degradado + scroll centrado que comparten login, registro y recuperación de contraseña.
export function AuthScreen({ children, showBack = true }: Props) {
  const insets = useSafeAreaInsets();
  // Deja libre la franja de la flecha para que la tarjeta no quede debajo en pantallas cortas.
  const top = insets.top + 56;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={gradients.auth} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.container, showBack && { paddingTop: top }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {showBack && (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Regresar"
          style={{ position: 'absolute', left: 16, top: insets.top + 8 }}
          className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white active:bg-carbon-50"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.backgroundTint },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 24 },
});
