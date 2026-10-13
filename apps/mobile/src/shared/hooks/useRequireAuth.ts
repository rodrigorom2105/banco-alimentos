import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/providers';

/**
 * Para los botones que llevan a una pantalla que exige sesión.
 *
 * Con sesión navega directo. Sin sesión guarda el destino y manda a iniciar sesión; cuando la
 * sesión aparece, el layout raíz lleva al usuario a donde quería ir.
 */
export function useRequireAuth() {
  const { session, setPendingRedirect } = useAuth();

  return useCallback(
    (href: Href) => {
      if (session) {
        router.push(href);
        return;
      }
      setPendingRedirect(href);
      router.push('/login');
    },
    [session, setPendingRedirect],
  );
}
