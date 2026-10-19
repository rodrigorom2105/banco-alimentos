import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/shared/components';
import { colors } from '@/shared/theme';

export type ExploreView = 'map' | 'list';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const OPTIONS: { value: ExploreView; label: string; icon: IconName }[] = [
  { value: 'map', label: 'Mapa', icon: 'map-outline' },
  { value: 'list', label: 'Lista', icon: 'format-list-bulleted' },
];

// Alto total del selector; ExploreMap lo usa para colocar el buscador justo debajo.
export const VIEW_TOGGLE_HEIGHT = 48;

type Props = {
  value: ExploreView;
  onChange: (view: ExploreView) => void;
  style?: StyleProp<ViewStyle>;
};

// Selector de ancho completo entre la vista de mapa y la de lista.
export function ViewToggle({ value, onChange, style }: Props) {
  return (
    <View
      className="flex-row rounded-full border border-line bg-white p-1"
      style={[{ height: VIEW_TOGGLE_HEIGHT }, style]}
      accessibilityRole="tablist"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        const color = selected ? '#FFFFFF' : colors.textSecondary;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-full ${
              selected ? 'bg-brand-500' : ''
            }`}
          >
            <MaterialCommunityIcons name={option.icon} size={18} color={color} />
            <Text
              className={`font-heading text-[15px] ${selected ? 'text-white' : 'text-carbon-500'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
