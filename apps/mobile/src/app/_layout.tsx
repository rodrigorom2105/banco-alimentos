import { Stack } from 'expo-router';

import { AppProviders, useAuth } from '@/providers';

// Pantallas con sesión fuera de las pestañas. Cada una dibuja su propio encabezado (Screen),
// por eso la barra nativa va oculta. Deben quedar dentro de Stack.Protected: una ruta que no
// se declare ahí queda accesible sin sesión.
const SIGNED_IN_SCREENS = [
  'campaign/[id]',
  'donation/new',
  'my-campaigns/index',
  'my-campaigns/new',
  'my-campaigns/[id]/index',
  'my-campaigns/[id]/edit',
  'volunteer/apply',
  'volunteer/dashboard',
];

function RootNavigator() {
  const { session, isLoading, isRecoveringPassword } = useAuth();
  if (isLoading) return null;

  const isSignedIn = !!session && !isRecoveringPassword;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        {SIGNED_IN_SCREENS.map((name) => (
          <Stack.Screen key={name} name={name} />
        ))}
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
