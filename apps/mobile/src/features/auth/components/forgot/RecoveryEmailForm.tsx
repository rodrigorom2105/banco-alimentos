import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Input, Text } from '@/shared/components';

import { useSendResetCode } from '../../hooks/useSendResetCode';

export function RecoveryEmailForm() {
  const [email, setEmail] = useState('');
  const { sendCode, isLoading } = useSendResetCode();

  const onSubmit = async () => {
    if (await sendCode(email)) {
      router.push({ pathname: '/forgot-password/verify', params: { email: email.trim() } });
    }
  };

  return (
    <Card>
      <Text className="mb-1 font-title text-2xl text-carbon-900">Recupera tu cuenta</Text>
      <Text className="mb-6 text-center font-body text-[15px] text-carbon-500">
        Escribe el correo de tu cuenta y te enviaremos un código.
      </Text>
      <View className="gap-4 self-stretch">
        <Input
          placeholder="Correo de recuperación"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button title="Continuar" onPress={onSubmit} loading={isLoading} />
      </View>
    </Card>
  );
}
