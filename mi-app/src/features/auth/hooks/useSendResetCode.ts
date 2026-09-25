import { useState } from 'react';
import { Alert } from 'react-native';

import { authApi } from '../api/authApi';
import { authErrorMessage } from '../errors';
import { isValidEmail } from '../validation';

// Envía (o reenvía) el código de recuperación al correo. Devuelve true si se envió.
export function useSendResetCode() {
  const [isLoading, setIsLoading] = useState(false);

  const sendCode = async (email: string): Promise<boolean> => {
    if (isLoading) return false;
    if (!email.trim()) {
      Alert.alert('Error de validación', 'Por favor, introduce un correo electrónico.');
      return false;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Error de validación', 'Por favor, introduce un correo electrónico válido.');
      return false;
    }

    setIsLoading(true);
    try {
      await authApi.sendResetCode(email);
      return true;
    } catch (e) {
      Alert.alert('Error', authErrorMessage(e));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendCode, isLoading };
}
