import { Stack } from 'expo-router';

import { AppProviders, useAuth } from '@/providers';

function RootNavigator() {
  const { session, isLoading, isRecoveringPassword } = useAuth();
  if (isLoading) return null;

  const isSignedIn = !!session && !isRecoveringPassword;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
