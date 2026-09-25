import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { SignupSuccess } from '@/features/auth';
import { colors, spacing } from '@/shared/theme';

export default function SuccessScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SignupSuccess email={email} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
