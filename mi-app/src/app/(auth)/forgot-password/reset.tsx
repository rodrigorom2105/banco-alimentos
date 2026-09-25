import { Redirect } from 'expo-router';

import { AuthScreen, NewPasswordForm } from '@/features/auth';
import { useAuth } from '@/providers';

export default function ResetPasswordScreen() {
  const { session, isRecoveringPassword } = useAuth();
  // Solo se llega aquí después de verificar el código (sesión de recuperación activa).
  if (!session || !isRecoveringPassword) return <Redirect href="/forgot-password" />;

  return (
    <AuthScreen>
      <NewPasswordForm />
    </AuthScreen>
  );
}
