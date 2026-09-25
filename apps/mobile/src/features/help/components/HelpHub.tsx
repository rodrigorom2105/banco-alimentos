import { router, type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';

import { useMyRoles } from '@/features/profile';
import { DEV_ALL_ROLES } from '@/shared/lib/devFlags';
import { colors, spacing } from '@/shared/theme';

import { HelpOption, type HelpIcon } from './HelpOption';

type Option = { key: string; icon: HelpIcon; title: string; description: string; href: Href };

const VOLUNTEER_STATUS_TEXT: Record<string, string> = {
  pending: 'Tu solicitud está en revisión por BAMX',
  rejected: 'Tu solicitud no fue aprobada',
  suspended: 'Tu voluntariado está suspendido',
};

// Qué opciones ve cada rol:
// - Registrar campaña / Mi campaña: voluntarios aprobados y admins.
// - Ser voluntario: donadores (quien aún no es voluntario ni admin).
// - Mi voluntariado: voluntarios aprobados.
// - Donar desde casa: todos.
type RolesInput = Pick<
  ReturnType<typeof useMyRoles>,
  'isAdmin' | 'isVolunteer' | 'volunteerStatus'
>;

function optionsFor({ isAdmin, isVolunteer, volunteerStatus }: RolesInput): Option[] {
  const options: Option[] = [];

  if (isVolunteer || isAdmin) {
    options.push(
      {
        key: 'new-campaign',
        icon: 'bullhorn-outline',
        title: 'Registrar campaña',
        description: 'Da de alta tu iniciativa',
        href: '/my-campaigns/new',
      },
      {
        key: 'my-campaigns',
        icon: 'clipboard-list-outline',
        title: isAdmin ? 'Campañas' : 'Mi campaña',
        description: isAdmin
          ? 'Revisa, aprueba y administra todas las campañas'
          : 'Da seguimiento a las campañas que registraste',
        href: '/my-campaigns',
      },
    );
  }

  if (isVolunteer) {
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

  if (roles.isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Elige cómo quieres apoyar al Banco de Alimentos.</Text>
      {optionsFor(roles).map((option) => (
        <HelpOption
          key={option.key}
          icon={option.icon}
          title={option.title}
          description={option.description}
          onPress={() => router.push(option.href)}
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
