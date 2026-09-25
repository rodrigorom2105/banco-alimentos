import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
};

export function Button({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const isDisabled = disabled || loading;
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isOutline && styles.outline,
        (pressed || isDisabled) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, isOutline && styles.outlineText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  dimmed: { opacity: 0.6 },
  text: { color: '#fff', fontWeight: '600', fontSize: 16 },
  outlineText: { color: colors.primary },
});
