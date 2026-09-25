import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { colors, gradients } from '@/shared/theme';

// Fondo degradado + scroll centrado que comparten login y recuperación de contraseña.
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={gradients.auth} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.backgroundTint },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
});
