import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/shared/components';

// Vista de "Mi cuenta" para quien entró sin sesión.
export function GuestProfile() {
  return (
    <View className="items-center gap-4 rounded-card border border-line bg-white p-6">
      <Image
        source={require('@/assets/images/BAMXlogo.png')}
        style={{ width: '50%', aspectRatio: 674 / 455 }}
        contentFit="contain"
      />
      <Text className="font-title text-2xl text-carbon-900">Aún no tienes sesión</Text>
      <Text className="text-center font-body text-sm leading-5 text-carbon-500">
        Puedes explorar las campañas sin cuenta. Inicia sesión para donar desde casa, registrar una
        campaña o ser voluntario.
      </Text>
      <View className="gap-3 self-stretch">
        <Button title="Iniciar sesión" onPress={() => router.push('/login')} />
        <Button title="Crear cuenta" variant="outline" onPress={() => router.push('/register')} />
      </View>
    </View>
  );
}
