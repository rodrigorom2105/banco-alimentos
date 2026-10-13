import { type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';

import { useMyRoles } from '@/features/profile';
import { useAuth } from '@/providers';
import { useRequireAuth } from '@/shared/hooks';
import { DEV_ALL_ROLES } from '@/shared/lib/devFlags';
import { colors, spacing } from '@/shared/theme';

import { HelpOption, type HelpIcon } from './HelpOption';

type Option = { key: string; icon: HelpIcon; title: string; description: string; href: Href };

const VOLUNTEER_STATUS_TEXT: Record<string, string> = {
  pending: 'Tu solicitud está en revisión por BAMX',
  rejected: 'Tu solicitud no fue aprobada',
  suspended: 'Tu voluntariado está suspendido',
};

// Qué opciones ve cada quien:
// - Registrar campaña, Ser voluntario y Donar desde casa: todos, incluso sin sesión (al
//   tocarlas se pide iniciar sesión).
// - Mi campaña y Mi voluntariado: solo con sesión, porque muestran datos propios.
// (Los detalles que faltan —Mi campaña según las campañas propias, Panel BAMX— son de la Fase 6.)
type RolesInput = Pick<
  ReturnType<typeof useMyRoles>,
  'isAdmin' | 'isVolunteer' | 'volunteerStatus'
> & { isSignedIn: boolean };

function optionsFor({ isSignedIn, isAdmin, isVolunteer, volunteerStatus }: RolesInput): Option[] {
  const options: Option[] = [];

  // Registrar campaña la ve cualquiera: la revisión del admin es la que valida (decisión 3
  // del plan). RLS también lo permite: basta tener sesión y ser el organizador.
  options.push({
    key: 'new-campaign',
    icon: 'bullhorn-outline',
    title: 'Registrar campaña',
    description: 'Da de alta tu iniciativa',
    href: '/my-campaigns/new',
  });

  // Con sesión siempre: si no, quien registra una campaña no tendría cómo volver a verla.
  // En F6 se afina para mostrarla solo cuando tiene campañas, y con el nombre de la campaña.
  if (isSignedIn) {
    options.push({
      key: 'my-campaigns',
      icon: 'clipboard-list-outline',
      title: isAdmin ? 'Campañas' : 'Mis campañas',
      description: isAdmin
        ? 'Revisa, aprueba y administra todas las campañas'
        : 'Da seguimiento a las campañas que registraste',
      href: '/my-campaigns',
    });
  }

  if (isSignedIn && isVolunteer) {
    options.push({
      key: 'volunteer-dashboard',
      icon: 'account-heart-outline',
      title: 'Mi voluntariado',
      description: 'Panel de voluntario',
      href: '/volunteer/dashboard',
    });
  }
  // En modo de prueba se muestra también, aunque la cuenta se trate como voluntario.
  if (DEV_ALL_ROLES || (!isVolunteer && !isAdmin)) {
    options.push({
      key: 'volunteer-apply',
      icon: 'hand-heart-outline',
      title: 'Ser voluntario',
      description:
        (volunteerStatus && VOLUNTEER_STATUS_TEXT[volunteerStatus]) ?? 'Regístrate como voluntario',
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

  return options;
}

export function HelpHub() {
  const roles = useMyRoles();
  const { session } = useAuth();
  const requireAuth = useRequireAuth();

  if (roles.isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Elige cómo quieres apoyar al Banco de Alimentos.</Text>
      {optionsFor({ ...roles, isSignedIn: !!session }).map((option) => (
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
      {roles.error && <Text style={styles.error}>No se pudo cargar tu rol: {roles.error}</Text>}
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
