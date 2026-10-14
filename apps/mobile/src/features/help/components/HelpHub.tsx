import { type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';

import { useHelpContext, type HelpContext } from '@/features/profile';
import { useRequireAuth } from '@/shared/hooks';
import { colors, spacing } from '@/shared/theme';

import { HelpOption, type HelpIcon } from './HelpOption';

type Option = { key: string; icon: HelpIcon; title: string; description: string; href: Href };

const VOLUNTEER_DESCRIPTION: Record<string, string> = {
  pending: 'Tu solicitud está en revisión por BAMX',
  rejected: 'Tu solicitud no fue aprobada',
  suspended: 'Tu voluntariado está suspendido',
  approved: 'Panel de voluntario',
};

/**
 * Qué opciones ve cada quien. Función pura: recibe el contexto y devuelve la lista.
 *
 * Ayudar es "cómo yo apoyo a BAMX", así que es igual para todos, admins incluidos: la
 * revisión de campañas y voluntarios vive en el Panel BAMX, al que se entra desde Inicio.
 *
 * | Opción             | Quién la ve                                          |
 * |--------------------|------------------------------------------------------|
 * | Registrar campaña  | Todos (sin sesión pide login)                        |
 * | Mis campañas       | Quien tenga al menos una campaña propia              |
 * | Ser voluntario     | Quien NO tenga solicitud (o no tenga sesión)         |
 * | Mi voluntariado    | Quien tenga solicitud, en cualquier estado           |
 * | Donar desde casa   | Todos (sin sesión pide login)                        |
 */
export function optionsFor(context: HelpContext, isSignedIn: boolean): Option[] {
  const options: Option[] = [];
  const { volunteer, myCampaigns } = context;

  // La revisión del admin es la que valida, así que cualquiera puede registrar (decisión 3).
  options.push({
    key: 'new-campaign',
    icon: 'bullhorn-outline',
    title: 'Registrar campaña',
    description: 'Da de alta tu iniciativa',
    href: '/my-campaigns/new',
  });

  // Se muestra con cualquier campaña propia, incluidas las finalizadas: es su historial, y
  // esconderle la pantalla el día que termina su campaña se sentiría como si se la borraran.
  if (myCampaigns.count > 0) {
    options.push({
      key: 'my-campaigns',
      icon: 'clipboard-list-outline',
      // Con una sola campaña se dice su nombre; con varias, el genérico.
      title: myCampaigns.onlyName ?? 'Mis campañas',
      description:
        myCampaigns.count === 1
          ? 'Da seguimiento a tu campaña'
          : `Da seguimiento a tus ${myCampaigns.count} campañas`,
      href: '/my-campaigns',
    });
  }

  // Una u otra, nunca las dos: la base solo permite una solicitud por persona.
  if (volunteer) {
    options.push({
      key: 'volunteer-dashboard',
      icon: 'account-heart-outline',
      title: 'Mi voluntariado',
      description: VOLUNTEER_DESCRIPTION[volunteer.status] ?? 'Panel de voluntario',
      href: '/volunteer/dashboard',
    });
  } else {
    options.push({
      key: 'volunteer-apply',
      icon: 'hand-heart-outline',
      title: 'Ser voluntario',
      description: 'Regístrate como voluntario',
      href: '/volunteer/apply',
    });
  }

  options.push({
    key: 'donate',
    icon: 'home-heart',
    title: 'Donar desde casa',
    description: 'Solicita una recolección a domicilio',
    href: '/donation/new',
  });

  // Un invitado ve las tres opciones abiertas; las que dependen de datos propios no aplican
  // porque su contexto viene vacío.
  return isSignedIn ? options : options.filter((o) => o.key !== 'my-campaigns');
}

export function HelpHub() {
  const { context, isSignedIn, isLoading, error } = useHelpContext();
  const requireAuth = useRequireAuth();

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Elige cómo quieres apoyar al Banco de Alimentos.</Text>
      {optionsFor(context, isSignedIn).map((option) => (
        <HelpOption
          key={option.key}
          icon={option.icon}
          title={option.title}
          description={option.description}
          // Todas estas pantallas exigen sesión: sin ella se manda a iniciar sesión y al
          // volver se abre la que se quería.
          onPress={() => requireAuth(option.href)}
        />
      ))}
      {error && <Text style={styles.error}>No se pudo cargar tu información: {error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // El fondo va en el ScrollView (no solo en su contenido) para cubrir toda la pantalla.
  screen: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, backgroundColor: colors.background },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  error: { fontSize: 12, color: colors.danger },
});
