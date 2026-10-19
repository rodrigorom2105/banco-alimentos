import { TextInput, type TextInputProps } from 'react-native';

import { colors } from '@/shared/theme';

type Props = TextInputProps & { variant?: 'outline' | 'filled' };

export function Input({ variant = 'outline', ...props }: Props) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      {...props}
      className={`rounded-button border px-4 py-3.5 font-body text-base text-carbon-500 focus:border-brand-500 ${
        variant === 'filled' ? 'border-carbon-50 bg-carbon-50' : 'border-line bg-white'
      }`}
    />
  );
}
