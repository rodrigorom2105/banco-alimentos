import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth, formatDistance } from '@/shared/utils';

import { CAMPAIGN_TYPE_LABELS } from '../labels';
import type { Campaign } from '../types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function InfoRow({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      <Text style={styles.infoText}>{children}</Text>
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {campaign.cover_image_url && (
          <Image
            source={{ uri: campaign.cover_image_url }}
            style={styles.cover}
            contentFit="cover"
          />
        )}
        <Text style={styles.badge}>{CAMPAIGN_TYPE_LABELS[campaign.type]}</Text>
        <Text style={styles.name}>{campaign.name}</Text>
        {distanceKm !== null && <Text style={styles.distance}>{formatDistance(distanceKm)}</Text>}

        <View style={styles.info}>
          <InfoRow icon="map-marker-outline">{address}</InfoRow>
          {dates && <InfoRow icon="calendar-range">{dates}</InfoRow>}
          {campaign.schedule && <InfoRow icon="clock-outline">{campaign.schedule}</InfoRow>}
          {campaign.contact_phone && (
            <InfoRow icon="phone-outline">{campaign.contact_phone}</InfoRow>
          )}
        </View>

        {campaign.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{campaign.description}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            title="Contactar"
            variant="outline"
            disabled={!campaign.contact_phone}
            onPress={() => campaign.contact_phone && contact(campaign.contact_phone)}
          />
        </View>
        <View style={styles.action}>
          <Button title="Cómo llegar" onPress={() => openDirections(campaign)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundTint,
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  distance: { fontSize: 14, fontWeight: '600', color: colors.primary },
  info: { gap: spacing.sm, marginTop: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  infoText: { flex: 1, fontSize: 15, color: colors.text },
  section: { gap: spacing.xs, marginTop: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  description: { fontSize: 15, lineHeight: 22, color: colors.text },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: { flex: 1 },
});
