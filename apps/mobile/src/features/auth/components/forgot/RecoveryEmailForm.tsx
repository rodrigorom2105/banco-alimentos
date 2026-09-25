import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

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
      <Text style={styles.title}>Correo de la cuenta</Text>
      <View style={styles.fields}>
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

const styles = StyleSheet.create({
  title: { fontSize: 20, color: colors.primary, fontWeight: 'bold', marginBottom: spacing.lg },
  fields: { alignSelf: 'stretch', gap: spacing.md },
});
