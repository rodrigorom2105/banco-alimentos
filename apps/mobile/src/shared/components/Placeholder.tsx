import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors } from '@/shared/theme';

// Pantalla informativa para rutas sin contenido todavía o sin permiso.
export function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-cream p-8">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-accent-50">
        <MaterialCommunityIcons name="information-outline" size={44} color={colors.accent} />
      </View>
      <Text className="text-center font-heading text-lg text-carbon-900">{title}</Text>
      <Text className="text-center font-body text-sm leading-5 text-carbon-500">{message}</Text>
    </View>
  );
}
