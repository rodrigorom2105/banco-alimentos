import { StyleSheet, View } from 'react-native';

import { ProfileDetails } from '@/features/profile';
import { useAuth } from '@/providers';
import { Button, Screen } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  return (
    <Screen title="Mi cuenta" showBack={false}>
      <View style={styles.container}>
        <ProfileDetails />
        <Button title="Cerrar sesión" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, gap: spacing.lg, backgroundColor: colors.background },
});
