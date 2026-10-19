import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Input, Text } from '@/shared/components';
import { colors, fonts } from '@/shared/theme';

import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useLogin();

  return (
    <Card>
      <Image
        source={require('@/assets/images/BAMXlogo.png')}
        style={{ width: '60%', aspectRatio: 674 / 455 }}
        contentFit="contain"
      />
      <Text className="mb-1 mt-4 font-title text-2xl text-carbon-900">Bienvenido</Text>
      <Text className="mb-6 text-center font-body text-base text-carbon-500">
        Inicia sesión para donar y ayudar en tu zona
      </Text>
      <View className="gap-4 self-stretch">
        <Input
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Input
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        <Button title="Ingresar" onPress={() => login({ email, password })} loading={isLoading} />
      </View>
      <View className="mt-5 flex-row justify-between self-stretch">
        <Link href="/forgot-password" style={{ color: colors.primary, fontFamily: fonts.heading }}>
          ¿Olvidó su contraseña?
        </Link>
        <Link href="/register" style={{ color: colors.primary, fontFamily: fonts.heading }}>
          Registro
        </Link>
      </View>
    </Card>
  );
}
