import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';

import { Button } from './Button';

type Props = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

// Pantalla de confirmación tras enviar un formulario. Se usa en lugar de Alert porque
// Alert no muestra nada en web.
export function SuccessState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="check-circle-outline" size={64} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.action}>
        <Button title={actionLabel} onPress={onAction} />
      </View>
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
    backgroundColor: colors.background,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.md },
});
