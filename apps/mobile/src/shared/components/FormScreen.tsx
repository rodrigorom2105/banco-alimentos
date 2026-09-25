import { useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, spacing } from '@/shared/theme';

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

// Formulario con scroll que se recorre hacia arriba al abrir el teclado, para que el campo
// activo no quede tapado. Se usa KeyboardAvoidingView (incluido en React Native) porque
// react-native-keyboard-controller no está en Expo Go.
export function FormScreen({ children, contentStyle }: Props) {
  const containerRef = useRef<View>(null);
  // KeyboardAvoidingView calcula con su posición relativa al padre; como el encabezado de la
  // pantalla queda arriba, se le pasa su distancia real al borde superior de la ventana.
  const [offsetTop, setOffsetTop] = useState(0);

  return (
    <View
      ref={containerRef}
      style={styles.screen}
      onLayout={() => containerRef.current?.measureInWindow((_x, y) => setOffsetTop(y))}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior="padding"
        keyboardVerticalOffset={offsetTop}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
});
