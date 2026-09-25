import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

type Props = TextInputProps & { variant?: 'outline' | 'filled' };

export function Input({ variant = 'outline', ...props }: Props) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      {...props}
      style={[styles.input, variant === 'filled' && styles.filled, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  filled: { borderColor: colors.surface, backgroundColor: colors.surface },
});
