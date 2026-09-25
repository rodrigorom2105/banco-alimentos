import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

export function Input(props: TextInputProps) {
  return (
    <TextInput placeholderTextColor={colors.textSecondary} {...props} style={[styles.input, props.style]} />
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
});
