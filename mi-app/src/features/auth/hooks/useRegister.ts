import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { authApi } from '../api/authApi';
import { authErrorMessage } from '../errors';
import type { RegisterData } from '../types';
import { isValidEmail, isValidPhone, validateNewPassword } from '../validation';

function validate(data: RegisterData): string | null {
  if (!data.firstName.trim() || !data.lastName.trim() || !data.email || !data.password) {
    return 'Por favor, completa todos los campos obligatorios.';
  }
  if (!isValidEmail(data.email)) return 'El correo electrónico no es válido.';
  if (data.phone.trim() && !isValidPhone(data.phone)) return 'El teléfono debe tener 10 dígitos.';
  return validateNewPassword(data.password, data.confirmPassword);
}

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);

  const register = async (data: RegisterData) => {
    if (isLoading) return;
    const validationError = validate(data);
    if (validationError) {
      Alert.alert('Error de validación', validationError);
      return;
    }

    setIsLoading(true);
    try {
      const needsConfirmation = await authApi.register({ ...data, phone: data.phone.replace(/[\s-]/g, '') });
      // Sin confirmación por correo, Supabase ya inició sesión y el layout lleva a las tabs.
      if (needsConfirmation) router.replace({ pathname: '/success', params: { email: data.email.trim() } });
    } catch (e) {
      Alert.alert('Error', authErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading };
}
