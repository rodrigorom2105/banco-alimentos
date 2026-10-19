import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme';

type Tone = 'primary' | 'accent' | 'leaf' | 'carbon';

type Props = {
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  // "primary" es la tarjeta destacada (rojo sólido); el resto son blancas con un ícono de color.
  tone?: Tone;
  onPress: () => void;
};

const TONES: Record<Tone, { circle: string; icon: string }> = {
  primary: { circle: 'bg-white/20', icon: '#FFFFFF' },
  accent: { circle: 'bg-accent-50', icon: colors.accent },
  leaf: { circle: 'bg-leaf-50', icon: colors.success },
  carbon: { circle: 'bg-carbon-50', icon: colors.text },
};

export function HomeCard({ title, description, icon, tone = 'accent', onPress }: Props) {
  const isPrimary = tone === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`min-h-28 flex-row items-center gap-4 rounded-card p-5 ${
        isPrimary
          ? 'bg-brand-500 active:bg-brand-600'
          : 'border border-line bg-white active:bg-carbon-50'
      }`}
    >
      <View className={`h-14 w-14 items-center justify-center rounded-full ${TONES[tone].circle}`}>
        <MaterialCommunityIcons name={icon} size={28} color={TONES[tone].icon} />
      </View>
      <View className="flex-1 gap-1">
        <Text className={`font-heading text-lg ${isPrimary ? 'text-white' : 'text-carbon-900'}`}>
          {title}
        </Text>
        <Text
          className={`font-body text-sm leading-5 ${isPrimary ? 'text-white/90' : 'text-carbon-500'}`}
        >
          {description}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={isPrimary ? '#FFFFFF' : colors.textSecondary}
      />
    </Pressable>
  );
}
