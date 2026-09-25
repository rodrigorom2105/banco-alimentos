import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import { useMyProfile } from '../hooks/useMyProfile';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function ProfileDetails() {
  const { profile, email, isLoading, error } = useMyProfile();

  if (isLoading) return <ActivityIndicator color={colors.primary} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '—';

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{fullName}</Text>
      <Row label="Correo" value={email ?? '—'} />
      <Row label="Teléfono" value={profile?.phone || 'Sin registrar'} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  row: { gap: 2 },
  label: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 16, color: colors.text },
  error: { color: colors.danger },
});
