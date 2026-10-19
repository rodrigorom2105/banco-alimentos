import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components';
import { colors } from '@/shared/theme';

type Props = {
  count: number;
  onPress?: () => void;
};

export function NotificationBell({ count, onPress }: Props) {
  const label = count > 0 ? `Notificaciones, ${count} sin leer` : 'Notificaciones';
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      <View className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white">
        <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
      </View>
      {count > 0 && (
        <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1">
          <Text className="font-heading text-[10px] text-white">{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}
