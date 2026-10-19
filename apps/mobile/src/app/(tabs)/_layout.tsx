import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { AppTabBar } from '@/shared/components';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type TabIconProps = { focused: boolean; color: ColorValue; size: number };

// Ícono relleno cuando la pestaña está activa, contorno cuando no.
function TabIcon({
  active,
  inactive,
  focused,
  color,
  size,
}: TabIconProps & { active: IconName; inactive: IconName }) {
  return <MaterialCommunityIcons name={focused ? active : inactive} color={color} size={size} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        // Cada pestaña dibuja su propio encabezado.
        headerShown: false,
        // AppTabBar oculta la barra mientras el teclado está abierto (Android la subía).
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: (props) => <TabIcon active="home" inactive="home-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: (props) => <TabIcon active="map" inactive="map-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Ayudar',
          tabBarIcon: (props) => (
            <TabIcon active="hand-heart" inactive="hand-heart-outline" {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi cuenta',
          tabBarIcon: (props) => <TabIcon active="account" inactive="account-outline" {...props} />,
        }}
      />
    </Tabs>
  );
}
