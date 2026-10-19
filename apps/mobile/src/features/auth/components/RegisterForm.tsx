import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Input, Text } from '@/shared/components';
import { colors, fonts } from '@/shared/theme';

import { useRegister } from '../hooks/useRegister';

export function RegisterForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useRegister();

  return (
    <Card>
      <View className="mb-6 items-center gap-1">
        <Image
          source={require('@/assets/images/BAMXlogo.png')}
          style={{ width: 120, aspectRatio: 674 / 455 }}
          contentFit="contain"
        />
        <Text className="mt-2 font-title text-2xl text-carbon-900">Crear cuenta</Text>
        <Text className="text-center font-body text-[15px] text-carbon-500">
          Únete y empieza a ayudar en tu comunidad
        </Text>
      </View>

      <View className="gap-4 self-stretch">
        <Input
          placeholder="Nombre(s)"
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="given-name"
        />
        <Input
          placeholder="Apellidos"
          value={lastName}
          onChangeText={setLastName}
          autoComplete="family-name"
        />
        <Input
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <View className="gap-1">
          <Input
            placeholder="Teléfono (opcional)"
            value={phone}
            onChangeText={setPhone}
            autoComplete="tel"
            keyboardType="phone-pad"
          />
          <Text className="ml-1 font-body text-xs text-carbon-500">
            Lo necesitarás para pedir una recolección o ser voluntario.
          </Text>
        </View>
        <View className="gap-1">
          <Input
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Text className="ml-1 font-body text-xs text-carbon-500">
            Mínimo 8 caracteres, una mayúscula y un número.
          </Text>
        </View>
        <Input
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Button
          title="Registrarse"
          onPress={() => register({ firstName, lastName, email, phone, password, confirmPassword })}
          loading={isLoading}
        />
      </View>

      <Text className="mt-6 font-body text-[15px] text-carbon-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" replace style={{ color: colors.primary, fontFamily: fonts.heading }}>
          Inicia sesión
        </Link>
      </Text>
    </Card>
  );
}
