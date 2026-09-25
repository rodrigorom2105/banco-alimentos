import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

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
      <View style={styles.header}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Únete y empieza a ayudar en tu comunidad</Text>
      </View>

      <View style={styles.fields}>
        <Input placeholder="Nombre(s)" value={firstName} onChangeText={setFirstName} autoComplete="given-name" />
        <Input placeholder="Apellidos" value={lastName} onChangeText={setLastName} autoComplete="family-name" />
        <Input
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <View style={styles.group}>
          <Input
            placeholder="Teléfono (opcional)"
            value={phone}
            onChangeText={setPhone}
            autoComplete="tel"
            keyboardType="phone-pad"
          />
          <Text style={styles.hint}>Lo necesitarás para pedir una recolección o ser voluntario.</Text>
        </View>
        <View style={styles.group}>
          <Input
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Text style={styles.hint}>Mínimo 8 caracteres, una mayúscula y un número.</Text>
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

      <Text style={styles.footer}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" replace style={styles.footerLink}>
          Inicia sesión
        </Link>
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  fields: { alignSelf: 'stretch', gap: spacing.md },
  group: { gap: spacing.xs },
  hint: { fontSize: 12, color: colors.textSecondary, marginLeft: spacing.xs },
  footer: { marginTop: spacing.lg, fontSize: 15, color: colors.textSecondary },
  footerLink: { color: colors.primary, fontWeight: 'bold' },
});
