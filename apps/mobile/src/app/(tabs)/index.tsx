import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/shared/components';
import { usePendingCounts } from '@/features/admin';
import { HomeCard, NotificationBell } from '@/features/home';
import { useUnreadCount } from '@/features/notifications';
import { useMyProfile, useMyRoles } from '@/features/profile';
import { useAuth } from '@/providers';
import { useRequireAuth } from '@/shared/hooks';
import { colors } from '@/shared/theme';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: 32, padding: 20 }}>
        <View className="flex-row items-start justify-between">
          <View>
            {/* Sin sesión no hay nombre que saludar ni notificaciones que mostrar. */}
            <Text className="font-body text-sm text-carbon-500">
              {session ? 'Hola,' : 'Bienvenido a'}
            </Text>
            <Text className="font-title text-3xl text-carbon-900">
              {session ? fullName : 'BAMX Conecta'}
            </Text>
          </View>
          {session && (
            <NotificationBell count={unreadCount} onPress={() => router.push('/notifications')} />
          )}
        </View>

        <View className="gap-4">
          {/* El panel va primero y solo para admins: es lo que viene a hacer a la app. El
              resto de su vista es igual a la de cualquier usuario. */}
          {isAdmin && (
            <HomeCard
              title="Panel BAMX"
              description={pendingSummary(counts)}
              icon="shield-check-outline"
              tone="carbon"
              onPress={() => router.push('/admin')}
            />
          )}
          <HomeCard
            title="Donar desde casa"
            description="Solicita una recolección a domicilio"
            icon="package-variant-closed"
            tone="primary"
            onPress={() => requireAuth('/donation/new')}
          />
          <HomeCard
            title="Explorar"
            description="Encuentra campañas cerca de ti"
            icon="map-marker-radius-outline"
            tone="accent"
            onPress={() => router.navigate('/explore')}
          />
          <HomeCard
            title="¿Cómo puedo ayudar?"
            description="Conoce las iniciativas en las que puedes apoyar"
            icon="hand-heart-outline"
            tone="leaf"
            onPress={() => router.navigate('/help')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
