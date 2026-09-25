import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/providers';

import { authApi } from '../api/authApi';
import { authErrorMessage } from '../errors';

// Debe coincidir con "Email OTP Length" en Supabase → Authentication → Providers → Email.
export const RESET_CODE_LENGTH = 6;

export function useVerifyResetCode(email: string) {
  const { setRecoveringPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const verify = async (code: string) => {
    if (isLoading) return;
    if (code.length !== RESET_CODE_LENGTH) {
      Alert.alert('Error de validación', 'Por favor, introduce el código de verificación completo.');
      return;
    }

    setIsLoading(true);
    // Se marca antes de verificar: la sesión que crea Supabase no debe mandar a las tabs.
    setRecoveringPassword(true);
    try {
      await authApi.verifyResetCode(email, code);
      router.replace('/forgot-password/reset');
    } catch (e) {
      setRecoveringPassword(false);
      Alert.alert('Error', authErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { verify, isLoading };
}
