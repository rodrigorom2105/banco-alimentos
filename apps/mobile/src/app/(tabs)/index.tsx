import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeCard, NotificationBell } from '@/features/home';
import { useMyProfile } from '@/features/profile';
import { colors, spacing } from '@/shared/theme';

export default function HomeScreen() {
  const { profile } = useMyProfile();
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>
          {/* TODO: conectar el contador cuando exista la tabla de notificaciones */}
          <NotificationBell count={0} />
        </View>

        <View style={styles.cards}>
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
            onPress={() => router.push('/donation/new')}
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
