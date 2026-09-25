import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import type { Campaign, CampaignType } from '../types';

const TYPE_LABELS: Record<CampaignType, string> = {
  institutional: 'Centro BAMX',
  community: 'Campaña comunitaria',
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <View style={styles.card}>
      {campaign.cover_image_url && (
        <Image source={{ uri: campaign.cover_image_url }} style={styles.cover} contentFit="cover" />
      )}
      <View style={styles.body}>
        <Text style={styles.badge}>{TYPE_LABELS[campaign.type]}</Text>
        <Text style={styles.name}>{campaign.name}</Text>
        <Text style={styles.detail}>
          {campaign.address}
          {campaign.municipality ? `, ${campaign.municipality.name}` : ''}
        </Text>
        {campaign.schedule && <Text style={styles.detail}>🕒 {campaign.schedule}</Text>}
        {campaign.contact_phone && <Text style={styles.detail}>📞 {campaign.contact_phone}</Text>}
        {campaign.description && <Text style={styles.description}>{campaign.description}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  body: { padding: spacing.md, gap: spacing.xs },
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
  name: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  detail: { fontSize: 14, color: colors.textSecondary },
  description: { fontSize: 14, color: colors.text, marginTop: spacing.xs },
});
