import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { Alert, Linking, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/shared/components';
import { colors } from '@/shared/theme';
import { formatDayMonth, formatDistance } from '@/shared/utils';

import { CAMPAIGN_TYPE_LABELS } from '../labels';
import type { Campaign } from '../types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function InfoRow({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <Text className="flex-1 font-body text-[15px] leading-5 text-carbon-900">{children}</Text>
    </View>
  );
}

function formatDates({ start_date, end_date }: Campaign) {
  if (start_date && end_date)
    return `Del ${formatDayMonth(start_date)} al ${formatDayMonth(end_date)}`;
  if (end_date) return `Hasta ${formatDayMonth(end_date)}`;
  if (start_date) return `Desde ${formatDayMonth(start_date)}`;
  return null;
}

// WhatsApp necesita el número con lada de país; los de 10 dígitos se asumen de México.
function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `52${digits}` : digits;
}

function contact(phone: string) {
  const call = () => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  const whatsApp = () => Linking.openURL(`https://wa.me/${toWhatsAppNumber(phone)}`);

  // Alert con opciones no existe en web; ahí se abre directo la llamada.
  if (Platform.OS === 'web') return call();
  Alert.alert('Contactar', phone, [
    { text: 'Llamar', onPress: call },
    { text: 'WhatsApp', onPress: whatsApp },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

// La URL universal de Google Maps abre la app de mapas si está instalada, o el navegador.
function openDirections({ latitude, longitude }: Campaign) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
}

type Props = { campaign: Campaign; distanceKm: number | null };

export function CampaignDetail({ campaign, distanceKm }: Props) {
  const dates = formatDates(campaign);
  const address = campaign.municipality
    ? `${campaign.address}, ${campaign.municipality.name}`
    : campaign.address;

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {campaign.cover_image_url && (
          <Image
            source={{ uri: campaign.cover_image_url }}
            style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 24 }}
            contentFit="cover"
          />
        )}
        <View className="flex-row items-center gap-2">
          <View className="rounded-full bg-brand-50 px-3 py-1">
            <Text className="font-heading text-xs text-brand-500">
              {CAMPAIGN_TYPE_LABELS[campaign.type]}
            </Text>
          </View>
          {distanceKm !== null && (
            <View className="flex-row items-center gap-1 rounded-full bg-accent-50 px-3 py-1">
              <MaterialCommunityIcons name="map-marker" size={14} color={colors.accent} />
              <Text className="font-heading text-xs text-accent-600">
                {formatDistance(distanceKm)}
              </Text>
            </View>
          )}
        </View>
        <Text className="font-title text-3xl text-carbon-900">{campaign.name}</Text>

        <View className="mt-1 gap-4 rounded-card border border-line bg-white p-4">
          <InfoRow icon="map-marker-outline">{address}</InfoRow>
          {dates && <InfoRow icon="calendar-range">{dates}</InfoRow>}
          {campaign.schedule && <InfoRow icon="clock-outline">{campaign.schedule}</InfoRow>}
          {campaign.contact_phone && (
            <InfoRow icon="phone-outline">{campaign.contact_phone}</InfoRow>
          )}
        </View>

        {campaign.description && (
          <View className="mt-2 gap-2">
            <Text className="font-heading text-lg text-carbon-900">Descripción</Text>
            <Text className="font-body text-[15px] leading-6 text-carbon-500">
              {campaign.description}
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-line bg-white p-4">
        <View className="flex-1">
          <Button
            title="Contactar"
            variant="outline"
            disabled={!campaign.contact_phone}
            onPress={() => campaign.contact_phone && contact(campaign.contact_phone)}
          />
        </View>
        <View className="flex-1">
          <Button title="Cómo llegar" onPress={() => openDirections(campaign)} />
        </View>
      </View>
    </View>
  );
}
