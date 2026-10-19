import { View } from 'react-native';

import { AuthScreen, RegisterForm } from '@/features/auth';

export default function RegisterScreen() {
  return (
    <AuthScreen>
      <View className="w-full items-center">
        <RegisterForm />
      </View>
    </AuthScreen>
  );
}
