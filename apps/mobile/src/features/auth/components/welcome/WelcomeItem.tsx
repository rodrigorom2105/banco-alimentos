import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';

import { useAuth } from '@/providers';
import { Button } from '@/shared/components';

import type { WelcomeSlide } from '../../types';

type Props = {
  item: WelcomeSlide;
  isLastItem: boolean;
};

export function WelcomeItem({ item, isLastItem }: Props) {
  const { width } = useWindowDimensions();
  const { markWelcomeSeen } = useAuth();

  // Salir del carrusel por cualquiera de las tres puertas lo marca como visto, así no vuelve
  // a aparecer hasta que se cierre sesión.
  const leave = (to: 'register' | 'login' | 'explore') => {
    markWelcomeSeen();
    if (to === 'explore') router.replace('/');
    else router.push(to === 'register' ? '/register' : '/login');
  };

  return (
    <View className="flex-1 items-center justify-center" style={{ width }}>
      <Image
        source={item.image}
        style={{ width, height: 300, marginBottom: 24 }}
        contentFit="contain"
      />
      {isLastItem ? (
        <View className="w-full gap-3 px-8">
          <Button title="Crear cuenta" onPress={() => leave('register')} />
          <Button title="Explorar sin cuenta" variant="outline" onPress={() => leave('explore')} />
          <Text className="mt-3 text-center font-body text-base text-carbon-500">
            ¿Ya cuentas con un perfil?{' '}
            <Text className="font-heading text-brand-500" onPress={() => leave('login')}>
              Inicia sesión
            </Text>
          </Text>
        </View>
      ) : (
        <>
          <Text className="mt-6 px-8 text-center font-title text-3xl text-brand-500">
            {item.title}
          </Text>
          <Text className="mt-2 px-12 text-center font-body text-base leading-6 text-carbon-500">
            {item.description}
          </Text>
        </>
      )}
    </View>
  );
}
