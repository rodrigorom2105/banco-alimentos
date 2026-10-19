import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components';
import { colors } from '@/shared/theme';

import { usePendingCounts } from '../hooks/useAdminQueries';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Tone = 'brand' | 'accent' | 'leaf' | 'carbon';

type Section = {
  key: string;
  icon: IconName;
  tone: Tone;
  title: string;
  description: string;
  href: Href;
  pending?: number;
};

const TONES: Record<Tone, { circle: string; icon: string }> = {
  brand: { circle: 'bg-brand-50', icon: colors.primary },
  accent: { circle: 'bg-accent-50', icon: colors.accent },
  leaf: { circle: 'bg-leaf-50', icon: colors.success },
  carbon: { circle: 'bg-carbon-50', icon: colors.text },
};

function SectionRow({ section }: { section: Section }) {
  const tone = TONES[section.tone];
  return (
    <Pressable
      onPress={() => router.push(section.href)}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-card border border-line bg-white p-4 active:bg-carbon-50"
    >
      <View className={`h-14 w-14 items-center justify-center rounded-full ${tone.circle}`}>
        <MaterialCommunityIcons name={section.icon} size={28} color={tone.icon} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-heading text-base text-carbon-900">{section.title}</Text>
        <Text className="font-body text-[13px] leading-[18px] text-carbon-500">
          {section.description}
        </Text>
      </View>
      {/* El contador solo aparece si hay algo por hacer: un cero no es información útil. */}
      {!!section.pending && (
        <View className="h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5">
          <Text className="font-heading text-xs text-white">{section.pending}</Text>
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
      tone: 'accent',
      title: 'Campañas',
      description: 'Revisa, aprueba y administra todas las campañas',
      href: '/admin/campaigns',
      pending: counts.campaigns,
    },
    {
      key: 'volunteers',
      icon: 'account-heart-outline',
      tone: 'leaf',
      title: 'Voluntarios',
      description: 'Valida documentos y aprueba solicitudes',
      href: '/admin/volunteers',
      pending: counts.volunteers,
    },
    {
      key: 'support',
      icon: 'hand-heart-outline',
      tone: 'brand',
      title: 'Solicitudes de apoyo',
      description: 'Contenedores, difusión y material que piden las campañas',
      href: '/admin/support',
      pending: counts.support,
    },
    {
      key: 'donations',
      icon: 'package-variant-closed',
      tone: 'brand',
      title: 'Donaciones sin voluntario',
      description: 'Donativos a domicilio que la plataforma no pudo asignar',
      href: '/admin/donations',
      pending: counts.donations,
    },
    {
      key: 'centers',
      icon: 'store-outline',
      tone: 'carbon',
      title: 'Registrar Centro BAMX',
      description: 'Da de alta un centro de acopio permanente',
      href: '/admin/centers/new',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {sections.map((section) => (
        <SectionRow key={section.key} section={section} />
      ))}
    </ScrollView>
  );
}
