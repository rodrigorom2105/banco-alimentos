import { Alert, Platform } from 'react-native';

// Alert.alert con botones no funciona en web; ahí se usa el confirm del navegador.
export function confirm(title: string, message: string, confirmText = 'Confirmar') {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}
