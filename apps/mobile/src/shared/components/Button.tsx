import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/shared/theme';

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
      className={`items-center rounded-button px-6 py-4 ${
        isOutline
          ? 'border-2 border-brand-500 bg-transparent active:bg-brand-50'
          : 'bg-brand-500 active:bg-brand-600'
      } ${isDisabled ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text className={`font-heading text-base ${isOutline ? 'text-brand-500' : 'text-white'}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
