import { useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/providers';

import { authApi } from '../api/authApi';
import { authErrorMessage } from '../errors';
import { validateNewPassword } from '../validation';

export function useResetPassword() {
  const { setRecoveringPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const resetPassword = async (newPassword: string, confirmPassword: string) => {
    if (isLoading) return;
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error de validación', 'Por favor, completa ambos campos.');
      return;
    }
    const validationError = validateNewPassword(newPassword, confirmPassword);
    if (validationError) {
      Alert.alert('Error de validación', validationError);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.updatePassword(newPassword);
      Alert.alert('Listo', 'Tu contraseña fue actualizada.');
      // La sesión de recuperación ya es una sesión normal: el layout lleva a las tabs.
      setRecoveringPassword(false);
    } catch (e) {
      Alert.alert('Error', authErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { resetPassword, isLoading };
}
