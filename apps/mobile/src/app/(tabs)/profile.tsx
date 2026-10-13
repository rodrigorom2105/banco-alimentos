import { StyleSheet, View } from 'react-native';

import { GuestProfile, ProfileDetails } from '@/features/profile';
import { useAuth } from '@/providers';
import { Button, Screen } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  return (
    <Screen title="Mi cuenta" showBack={false}>
      <View style={styles.container}>
        {session ? (
          <>
            <ProfileDetails />
            <Button title="Cerrar sesión" onPress={signOut} />
          </>
        ) : (
          <GuestProfile />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, gap: spacing.lg, backgroundColor: colors.background },
});
