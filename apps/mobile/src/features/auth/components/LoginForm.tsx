import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Input } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useLogin();

  return (
    <Card>
      <Image
        source={require('@/assets/images/auth/enter.png')}
        style={styles.image}
        contentFit="contain"
      />
      <View style={styles.fields}>
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
      <View style={styles.footer}>
        <Link href="/forgot-password" style={styles.footerText}>
          ¿Olvidó su contraseña?
        </Link>
        <Link href="/register" style={styles.footerText}>
          Registro
        </Link>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 350 / 300,
    borderRadius: 50,
    marginBottom: spacing.lg,
  },
  fields: { alignSelf: 'stretch', gap: spacing.md },
  footer: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { color: colors.primary, fontWeight: 'bold' },
});
