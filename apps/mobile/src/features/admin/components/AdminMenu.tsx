import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import { usePendingCounts } from '../hooks/useAdminQueries';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Section = {
  key: string;
  icon: IconName;
  title: string;
  description: string;
  href: Href;
  pending?: number;
};

function SectionRow({ section }: { section: Section }) {
  return (
    <Pressable
      onPress={() => router.push(section.href)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={section.icon} size={26} color={colors.primary} />
      <View style={styles.text}>
        <Text style={styles.title}>{section.title}</Text>
        <Text style={styles.description}>{section.description}</Text>
      </View>
      {/* El contador solo aparece si hay algo por hacer: un cero no es información útil. */}
      {!!section.pending && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{section.pending}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function AdminMenu() {
  const { counts } = usePendingCounts(true);

  const sections: Section[] = [
    {
      key: 'campaigns',
      icon: 'bullhorn-outline',
      title: 'Campañas',
      description: 'Revisa, aprueba y administra todas las campañas',
      href: '/admin/campaigns',
      pending: counts.campaigns,
    },
    {
      key: 'volunteers',
      icon: 'account-heart-outline',
      title: 'Voluntarios',
      description: 'Valida documentos y aprueba solicitudes',
      href: '/admin/volunteers',
      pending: counts.volunteers,
    },
    {
      key: 'support',
      icon: 'hand-heart-outline',
      title: 'Solicitudes de apoyo',
      description: 'Contenedores, difusión y material que piden las campañas',
      href: '/admin/support',
      pending: counts.support,
    },
    {
      key: 'centers',
      icon: 'store-outline',
      title: 'Registrar Centro BAMX',
      description: 'Da de alta un centro de acopio permanente',
      href: '/admin/centers/new',
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <SectionRow key={section.key} section={section} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  description: { fontSize: 13, color: colors.textSecondary },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: colors.background },
});
