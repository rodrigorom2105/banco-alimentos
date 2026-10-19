import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/shared/theme';

type Props = {
  children: ReactNode;
  // Sin título se muestra solo el botón de regreso (p. ej. en los detalles, que ya traen nombre).
  title?: string;
  showBack?: boolean;
};

// Contenedor de pantalla con encabezado propio (reemplaza la barra de navegación nativa):
// botón de regreso redondo y título grande, con el mismo estilo que el Home.
// SafeAreaView viene de react-native-safe-area-context: NativeWind no le aplica className.
export function Screen({ children, title, showBack = true }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {(title || showBack) && (
        <View className="flex-row items-center gap-3 px-4 pb-2 pt-3">
          {showBack && (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Regresar"
              className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white active:bg-carbon-50"
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
            </Pressable>
          )}
          {title && (
            <Text className="flex-1 font-title text-2xl text-carbon-900" numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
      )}
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
