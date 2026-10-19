import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { Button, Card, Text } from '@/shared/components';

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
      <Image
        source={require('@/assets/images/auth/verification.png')}
        style={{ width: '100%', aspectRatio: 352 / 300, borderRadius: 30 }}
        contentFit="contain"
      />
      <Text className="mb-6 mt-4 text-center font-title text-xl text-carbon-900">
        Ingresa el código que se te envió por correo
      </Text>
      <View className="mb-5 flex-row gap-2">
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            className={`h-14 w-11 rounded-button border bg-white text-center font-heading text-2xl text-carbon-900 focus:border-brand-500 ${
              digit ? 'border-brand-500' : 'border-line'
            }`}
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
      <View className="gap-4 self-stretch">
        <Button title="Verificar" onPress={() => verify(digits.join(''))} loading={isLoading} />
        <Text
          className="text-center font-heading text-brand-500"
          onPress={isResending ? undefined : onResend}
        >
          {isResending ? 'Enviando…' : 'Volver a enviar código'}
        </Text>
      </View>
    </Card>
  );
}
