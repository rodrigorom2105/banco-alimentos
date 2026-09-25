import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { useSendResetCode } from '../../hooks/useSendResetCode';
import { RESET_CODE_LENGTH, useVerifyResetCode } from '../../hooks/useVerifyResetCode';

const EMPTY_CODE = Array<string>(RESET_CODE_LENGTH).fill('');

export function VerificationCodeForm({ email }: { email: string }) {
  const [digits, setDigits] = useState(EMPTY_CODE);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { verify, isLoading } = useVerifyResetCode(email);
  const { sendCode, isLoading: isResending } = useSendResetCode();

  const onChangeDigit = (text: string, index: number) => {
    const clean = text.replace(/\D/g, '');

    // Si se pega el código completo, se reparte entre las casillas.
    if (clean.length === RESET_CODE_LENGTH) {
      setDigits(clean.split(''));
      inputRefs.current[RESET_CODE_LENGTH - 1]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean.slice(-1);
    setDigits(next);
    if (next[index] && index < RESET_CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const onKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const onResend = async () => {
    if (await sendCode(email)) {
      setDigits(EMPTY_CODE);
      Alert.alert('Verificación', 'Código de verificación reenviado con éxito.');
    }
  };

  return (
    <Card>
      <Image source={require('@/assets/images/auth/verification.png')} style={styles.image} contentFit="contain" />
      <Text style={styles.title}>Ingresa el código que se te envió por correo</Text>
      <View style={styles.digits}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            style={styles.digit}
            value={digit}
            onChangeText={(text) => onChangeDigit(text, index)}
            onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            accessibilityLabel={`Dígito ${index + 1}`}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <Button title="Verificar" onPress={() => verify(digits.join(''))} loading={isLoading} />
        <Text style={styles.resend} onPress={isResending ? undefined : onResend}>
          {isResending ? 'Enviando…' : 'Volver a enviar código'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 352 / 300, borderRadius: 30 },
  title: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  digits: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  digit: {
    width: 40,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textAlign: 'center',
    fontSize: 22,
    color: colors.text,
  },
  actions: { alignSelf: 'stretch', gap: spacing.md },
  resend: { color: colors.primary, fontWeight: 'bold', textAlign: 'center' },
});
