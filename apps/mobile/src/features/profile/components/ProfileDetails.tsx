import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/shared/components';
import { colors } from '@/shared/theme';

import { useMyProfile } from '../hooks/useMyProfile';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function Row({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-carbon-50">
        <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
      </View>
      <View className="flex-1">
        <Text className="font-heading text-xs uppercase tracking-wide text-carbon-500">
          {label}
        </Text>
        <Text className="font-body text-base text-carbon-900">{value}</Text>
      </View>
    </View>
  );
}

export function ProfileDetails() {
  const { profile, email, isLoading, error } = useMyProfile();

  if (isLoading) return <ActivityIndicator color={colors.primary} />;
  if (error) return <Text className="font-body text-sm text-brand-600">{error}</Text>;

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '—';
  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <View className="gap-5 rounded-card border border-line bg-white p-6">
      <View className="items-center gap-3">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <Text className="font-title text-3xl text-brand-500">{initials}</Text>
        </View>
        <Text className="text-center font-title text-2xl text-carbon-900">{fullName}</Text>
      </View>
      <View className="gap-4">
        <Row icon="email-outline" label="Correo" value={email ?? '—'} />
        <Row icon="phone-outline" label="Teléfono" value={profile?.phone || 'Sin registrar'} />
      </View>
    </View>
  );
}
