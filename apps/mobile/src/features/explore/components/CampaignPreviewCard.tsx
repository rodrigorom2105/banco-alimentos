import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth, formatDistance } from '@/shared/utils';

import type { ExploreCampaign } from '../types';

type Props = {
  campaign: ExploreCampaign;
  onPress: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function CampaignPreviewCard({ campaign, onPress, selected, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.name} numberOfLines={2}>
        {campaign.name}
      </Text>
      <View style={styles.meta}>
        {campaign.distanceKm !== null && (
          <Text style={styles.distance}>{formatDistance(campaign.distanceKm)}</Text>
        )}
        <Text style={styles.detail}>
          {campaign.end_date ? `Hasta ${formatDayMonth(campaign.end_date)}` : 'Sin fecha de cierre'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
  },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  pressed: { opacity: 0.7 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  distance: { fontSize: 13, fontWeight: '600', color: colors.primary },
  detail: { fontSize: 13, color: colors.textSecondary },
});
