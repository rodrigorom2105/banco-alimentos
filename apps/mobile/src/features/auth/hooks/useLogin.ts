import { useState } from 'react';
import { Alert } from 'react-native';

import { authApi } from '../api/authApi';
import { authErrorMessage } from '../errors';
import type { LoginCredentials } from '../types';
import { isValidEmail } from '../validation';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginCredentials) => {
    if (isLoading) return;
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error de validación', 'Por favor, completa todos los campos.');
      return;
    }
    if (!isValidEmail(credentials.email)) {
      Alert.alert('Error de validación', 'El correo electrónico no es válido.');
      return;
    }

    setIsLoading(true);
    try {
      // Al crearse la sesión, el layout raíz redirige solo a las tabs.
      await authApi.login(credentials);
    } catch (e) {
      Alert.alert('Error', authErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
