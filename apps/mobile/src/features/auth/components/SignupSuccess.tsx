import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/shared/components';
import { colors } from '@/shared/theme';

export function SignupSuccess({ email }: { email?: string }) {
  return (
    <View className="w-full max-w-[500px] items-center gap-4 rounded-card bg-white p-6 shadow-lg shadow-black/10">
      <View className="h-28 w-28 items-center justify-center rounded-full bg-leaf-50">
        <MaterialCommunityIcons name="email-check-outline" size={56} color={colors.success} />
      </View>
      <Text className="text-center font-title text-2xl text-carbon-900">
        ¡Tu cuenta fue creada!
      </Text>
      <Text className="text-center font-body text-base leading-6 text-carbon-500">
        Te enviamos un correo{email ? ` a ${email}` : ''} para confirmar tu cuenta. Ábrelo y después
        inicia sesión.
      </Text>
      <View className="mt-2 self-stretch">
        <Button title="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
      </View>
    </View>
  );
}
