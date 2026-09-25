import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { useResetPassword } from '../../hooks/useResetPassword';

export function NewPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { resetPassword, isLoading } = useResetPassword();

  return (
    <Card>
      <Text style={styles.title}>Restablecer contraseña</Text>
      <View style={styles.fields}>
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

const styles = StyleSheet.create({
  title: { fontSize: 20, color: colors.primary, fontWeight: 'bold', marginBottom: spacing.lg },
  fields: { alignSelf: 'stretch', gap: spacing.md },
});
