import { StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  neutral: { backgroundColor: colors.surface, color: colors.textSecondary },
  success: { backgroundColor: colors.backgroundTint, color: colors.primary },
  warning: { backgroundColor: colors.warningTint, color: colors.warning },
  danger: { backgroundColor: colors.dangerTint, color: colors.danger },
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  return <Text style={[styles.badge, TONES[tone]]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
