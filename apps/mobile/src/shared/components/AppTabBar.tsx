import type { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/shared/theme';

import { Text } from './Text';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// Barra de pestañas flotante: una píldora blanca con sombra. La pestaña activa se marca con una
// cápsula rosa con su ícono y su nombre; las demás muestran solo el ícono.
export function AppTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Android sube la barra con el teclado; se oculta mientras esté abierto (tabBarHideOnKeyboard).
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if (isKeyboardOpen && focusedOptions.tabBarHideOnKeyboard) return null;

  return (
    <View className="bg-cream px-4 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="flex-row items-center justify-around rounded-full border border-line bg-white p-2 shadow-lg shadow-black/10">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name as never);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              className={`flex-row items-center gap-2 rounded-full px-4 py-3 ${
                isFocused ? 'bg-brand-50' : 'active:bg-carbon-50'
              }`}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.primary : colors.textSecondary,
                size: 24,
              })}
              {isFocused && <Text className="font-heading text-sm text-brand-500">{label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
