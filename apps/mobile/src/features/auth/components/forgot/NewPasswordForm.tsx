import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Input } from '@/shared/components';

import { useResetPassword } from '../../hooks/useResetPassword';

export function NewPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { resetPassword, isLoading } = useResetPassword();

  return (
    <Card>
      <Text className="mb-1 font-title text-2xl text-carbon-900">Nueva contraseña</Text>
      <Text className="mb-6 text-center font-body text-[15px] text-carbon-500">
        Elige una contraseña nueva para tu cuenta.
      </Text>
      <View className="gap-4 self-stretch">
        <Input
          placeholder="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Input
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Button
          title="Guardar"
          onPress={() => resetPassword(newPassword, confirmPassword)}
          loading={isLoading}
        />
      </View>
    </Card>
  );
}
