import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components';
import { colors } from '@/shared/theme';

export type HelpIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type HelpTone = 'brand' | 'accent' | 'leaf' | 'carbon';

type Props = {
  icon: HelpIcon;
  title: string;
  description: string;
  tone?: HelpTone;
  onPress: () => void;
};

const TONES: Record<HelpTone, { circle: string; icon: string }> = {
  brand: { circle: 'bg-brand-50', icon: colors.primary },
  accent: { circle: 'bg-accent-50', icon: colors.accent },
  leaf: { circle: 'bg-leaf-50', icon: colors.success },
  carbon: { circle: 'bg-carbon-50', icon: colors.text },
};

export function HelpOption({ icon, title, description, tone = 'brand', onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-card border border-line bg-white p-4 active:bg-carbon-50"
    >
      <View className={`h-14 w-14 items-center justify-center rounded-full ${TONES[tone].circle}`}>
        <MaterialCommunityIcons name={icon} size={28} color={TONES[tone].icon} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-heading text-[17px] text-carbon-900">{title}</Text>
        <Text className="font-body text-xs leading-4 text-carbon-500">{description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}
