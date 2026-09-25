import { StyleSheet, View } from 'react-native';

import { ProfileDetails } from '@/features/profile';
import { useAuth } from '@/providers';
import { Button } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <ProfileDetails />
      <Button title="Cerrar sesión" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, gap: spacing.lg, backgroundColor: colors.background },
});
