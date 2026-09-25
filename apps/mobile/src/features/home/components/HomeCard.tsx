import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

type Props = {
  title: string;
  description: string;
  onPress: () => void;
};

export function HomeCard({ title, description, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 110,
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.7 },
  title: { fontSize: 18, color: colors.text },
  description: { fontSize: 12, color: colors.text },
});
