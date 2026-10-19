import { Pressable } from 'react-native';

import { Text } from './Text';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function FilterChip({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={`rounded-full border px-4 py-2 ${
        selected ? 'border-brand-500 bg-brand-500' : 'border-line bg-white active:bg-carbon-50'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text
        className={`text-[13px] ${selected ? 'font-body-bold text-white' : 'font-body text-carbon-500'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
