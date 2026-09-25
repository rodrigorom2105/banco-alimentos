import { Redirect, useLocalSearchParams } from 'expo-router';

import { AuthScreen, VerificationCodeForm } from '@/features/auth';

export default function VerifyCodeScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  if (!email) return <Redirect href="/forgot-password" />;

  return (
    <AuthScreen>
      <VerificationCodeForm email={email} />
    </AuthScreen>
  );
}
