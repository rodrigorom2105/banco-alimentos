import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/shared/theme';

type Props = {
  label: string;
  children: ReactNode;
  error?: string | null;
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Field({ label, children, error, hint, style }: Props) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        hint && <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontSize: 16, fontWeight: '500', color: colors.text },
  error: { fontSize: 12, color: colors.danger },
  hint: { fontSize: 12, color: colors.textSecondary },
});
