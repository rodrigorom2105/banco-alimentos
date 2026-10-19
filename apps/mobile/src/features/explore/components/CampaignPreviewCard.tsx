import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/shared/theme';
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
      style={style}
      className={`gap-3 rounded-card bg-white p-4 shadow-md shadow-black/10 active:bg-carbon-50 ${
        selected ? 'border-2 border-brand-500' : 'border border-line'
      }`}
    >
      <Text className="font-heading text-base text-carbon-900" numberOfLines={2}>
        {campaign.name}
      </Text>
      <View className="flex-row items-center justify-between gap-2">
        {campaign.distanceKm !== null && (
          <View className="flex-row items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1">
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />
            <Text className="font-body-bold text-xs text-brand-500">
              {formatDistance(campaign.distanceKm)}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-1">
          <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text className="font-body text-xs text-carbon-500">
            {campaign.end_date
              ? `Hasta ${formatDayMonth(campaign.end_date)}`
              : 'Sin fecha de cierre'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
