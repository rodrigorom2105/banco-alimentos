import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

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
    <View style={[styles.container, style]} accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        const color = selected ? colors.background : colors.textSecondary;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.option, selected && styles.selected]}
          >
            <MaterialCommunityIcons name={option.icon} size={18} color={color} />
            <Text style={[styles.label, { color }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: VIEW_TOGGLE_HEIGHT,
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
  },
  selected: { backgroundColor: colors.primary },
  label: { fontSize: 15, fontWeight: '600' },
});
