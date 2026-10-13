import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePendingCounts } from '@/features/admin';
import { HomeCard, NotificationBell } from '@/features/home';
import { useUnreadCount } from '@/features/notifications';
import { useMyProfile, useMyRoles } from '@/features/profile';
import { useAuth } from '@/providers';
import { useRequireAuth } from '@/shared/hooks';
import { colors, spacing } from '@/shared/theme';

// "3 campañas y 1 voluntario por revisar", sin partes en cero y en plural correcto.
function pendingSummary({
  campaigns,
  volunteers,
  support,
}: {
  campaigns: number;
  volunteers: number;
  support: number;
}) {
  const parts = [
    campaigns > 0 && `${campaigns} ${campaigns === 1 ? 'campaña' : 'campañas'}`,
    volunteers > 0 && `${volunteers} ${volunteers === 1 ? 'voluntario' : 'voluntarios'}`,
    support > 0 && `${support} ${support === 1 ? 'solicitud' : 'solicitudes'} de apoyo`,
  ].filter((part): part is string => !!part);

  if (parts.length === 0) return 'No tienes nada pendiente por revisar';
  return `${parts.join(', ').replace(/, ([^,]*)$/, ' y $1')} por revisar`;
}

export default function HomeScreen() {
  const { session } = useAuth();
  const { profile } = useMyProfile();
  const { isAdmin } = useMyRoles();
  const { unreadCount } = useUnreadCount();
  const { counts } = usePendingCounts(isAdmin);
  const requireAuth = useRequireAuth();
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            {/* Sin sesión no hay nombre que saludar ni notificaciones que mostrar. */}
            <Text style={styles.greeting}>{session ? 'Hola,' : 'Bienvenido a'}</Text>
            <Text style={styles.name}>{session ? fullName : 'BAMX Conecta'}</Text>
          </View>
          {session && (
            <NotificationBell count={unreadCount} onPress={() => router.push('/notifications')} />
          )}
        </View>

        <View style={styles.cards}>
          {/* El panel va primero y solo para admins: es lo que viene a hacer a la app. El
              resto de su vista es igual a la de cualquier usuario. */}
          {isAdmin && (
            <HomeCard
              title="Panel BAMX"
              description={pendingSummary(counts)}
              onPress={() => router.push('/admin')}
            />
          )}
          <HomeCard
            title="Explorar"
            description="Encuentra campañas cerca de ti"
            onPress={() => router.navigate('/explore')}
          />
          <HomeCard
            title="¿Cómo puedo ayudar?"
            description="Conoce las iniciativas en las que puedes apoyar"
            onPress={() => router.navigate('/help')}
          />
          <HomeCard
            title="Donar desde casa"
            description="Solicita una recolección a domicilio"
            onPress={() => requireAuth('/donation/new')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, gap: spacing.xl * 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: colors.text },
  name: { fontSize: 24, color: colors.text },
  cards: { gap: spacing.lg },
});
