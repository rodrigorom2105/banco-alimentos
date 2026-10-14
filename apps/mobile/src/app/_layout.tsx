import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

import { AppProviders, useAuth } from '@/providers';

// Sin sesión se puede ver Inicio, Explorar, Ayudar, Mi cuenta (vista de invitado) y el detalle
// de una campaña. Todo lo demás exige sesión: cada una de estas rutas dibuja su propio
// encabezado (Screen), por eso la barra nativa va oculta. Deben quedar dentro de
// Stack.Protected: una ruta que no se declare ahí queda accesible sin sesión, incluso por
// deep link.
const SIGNED_IN_SCREENS = [
  'donation/new',
  'donation/index',
  'donation/[id]',
  'notifications',
  'my-campaigns/index',
  'my-campaigns/new',
  'my-campaigns/[id]/index',
  'my-campaigns/[id]/edit',
  'volunteer/apply',
  'volunteer/dashboard',
  // Panel de administrador. Además de estar protegidas por sesión, cada pantalla esconde su
  // contenido a quien no es admin (AdminOnly) y el backend responde 403 a sus endpoints.
  'admin/index',
  'admin/campaigns',
  'admin/support',
  'admin/donations',
  'admin/volunteers/index',
  'admin/volunteers/[id]',
  'admin/centers/new',
];

// La app abre en las pestañas, no en el carrusel: un invitado entra directo a explorar.
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootNavigator() {
  const {
    session,
    isLoading,
    isRecoveringPassword,
    hasSeenWelcome,
    pendingRedirect,
    setPendingRedirect,
  } = useAuth();

  const isSignedIn = !!session && !isRecoveringPassword;

  // Carrusel de bienvenida: la primera vez que se abre la app y cada vez que se cierra sesión
  // (al cerrar sesión se borra la bandera).
  useEffect(() => {
    if (!isLoading && !isSignedIn && !hasSeenWelcome) router.replace('/welcome');
  }, [isLoading, isSignedIn, hasSeenWelcome]);

  // El invitado que quiso abrir una pantalla protegida llega a ella en cuanto inicia sesión.
  useEffect(() => {
    if (!isSignedIn || !pendingRedirect) return;
    const href = pendingRedirect;
    setPendingRedirect(null);
    router.push(href);
  }, [isSignedIn, pendingRedirect, setPendingRedirect]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="campaign/[id]" />
      {/* Los textos legales son públicos: un aviso de privacidad que solo se puede leer con
          cuenta no sirve de mucho. */}
      <Stack.Screen name="legal/privacy" />
      <Stack.Screen name="legal/terms" />
      <Stack.Protected guard={isSignedIn}>
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
