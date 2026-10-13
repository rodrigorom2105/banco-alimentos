import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { useMyRoles } from '@/features/profile';
import { Placeholder } from '@/shared/components';
import { colors } from '@/shared/theme';

/**
 * Esconde una pantalla de admin a quien no lo es.
 *
 * Es solo cortesía de interfaz: la seguridad de verdad está en el backend, que responde 403
 * a cualquier endpoint /admin si el token no pertenece a un admin. Si alguien llegara aquí
 * por un deep link, vería la pantalla vacía y ninguna petición le funcionaría.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useMyRoles();

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (!isAdmin) {
    return (
      <Placeholder
        title="No tienes acceso"
        message="Esta sección es solo para el personal de BAMX."
      />
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
