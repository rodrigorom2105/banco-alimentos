import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { colors } from '@/shared/theme';

import { Button } from './Button';
import { Text } from './Text';

type Props = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

// Pantalla de confirmación tras enviar un formulario. Se usa en lugar de Alert porque
// Alert no muestra nada en web.
export function SuccessState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-cream p-8">
      <View className="h-28 w-28 items-center justify-center rounded-full bg-leaf-50">
        <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
      </View>
      <Text className="text-center font-title text-2xl text-carbon-900">{title}</Text>
      <Text className="text-center font-body text-[15px] leading-6 text-carbon-500">{message}</Text>
      <View className="mt-4 self-stretch">
        <Button title={actionLabel} onPress={onAction} />
      </View>
    </View>
  );
}
