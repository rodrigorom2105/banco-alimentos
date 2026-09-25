import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/providers';
import { Button, PromptModal, StatusBadge } from '@/shared/components';
import { confirm } from '@/shared/lib/confirm';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { campaignsApi } from '../api/campaignsApi';
import {
  CAMPAIGN_STATUS,
  CAMPAIGN_TYPE_LABELS,
  SUPPORT_STATUS,
  SUPPORT_TYPE_LABELS,
} from '../labels';
import type { ManagedCampaign, SupportRequest, SupportType } from '../types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// "Recolección" no existe como tipo de apoyo en la base: se guarda como `other` con prefijo.
const SUPPORT_OPTIONS: { label: string; type: SupportType; prefix: string; placeholder: string }[] =
  [
    {
      label: 'Contenedores',
      type: 'containers',
      prefix: '',
      placeholder: 'Ej. 3 contenedores grandes para el 15 de octubre',
    },
    {
      label: 'Recolección',
      type: 'other',
      prefix: 'Recolección: ',
      placeholder: 'Ej. Tenemos ~80 kg listos, disponibles de 9 a 13 h',
    },
  ];

type SupportOption = (typeof SUPPORT_OPTIONS)[number];

const matchesOption = (request: SupportRequest, option: SupportOption) =>
  request.type === option.type &&
  (option.prefix ? request.description.startsWith(option.prefix) : true);

function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function StatTile({ label }: { label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>—</Text>
      <Text style={styles.statHint}>Próximamente</Text>
    </View>
  );
}

type Props = {
  campaign: ManagedCampaign;
  supportRequests: SupportRequest[];
  isAdmin: boolean;
  onChanged: () => void;
};

export function ManageCampaign({ campaign, supportRequests, isAdmin, onChanged }: Props) {
  const { user } = useAuth();
  const [supportOption, setSupportOption] = useState<SupportOption | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [busy, setBusy] = useState<'approve' | 'finish' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = campaign.organizer_id === user?.id;
  const { status } = campaign;
  const isLive = status === 'approved' || status === 'active';
  const canRequestSupport = isOwner && campaign.type === 'community' && isLive;
  const canEdit = (isOwner || isAdmin) && (status === 'pending' || isLive);
  const statusInfo = CAMPAIGN_STATUS[status];

  const runAction = async (action: 'approve' | 'finish', task: () => Promise<void>) => {
    setBusy(action);
    setError(null);
    try {
      await task();
      onChanged();
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo completar la acción.'));
    } finally {
      setBusy(null);
    }
  };

  const approve = () =>
    runAction('approve', () => campaignsApi.setStatus(campaign.id, user!.id, 'approved'));

  const finish = async () => {
    const ok = await confirm(
      'Finalizar campaña',
      'Dejará de aparecer en Explorar y no se puede deshacer. ¿La campaña realmente terminó?',
      'Finalizar',
    );
    if (ok) runAction('finish', () => campaignsApi.setStatus(campaign.id, user!.id, 'finished'));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{campaign.name}</Text>
          <View style={styles.badges}>
            <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
            <StatusBadge label={CAMPAIGN_TYPE_LABELS[campaign.type]} />
          </View>
          <InfoRow
            icon="map-marker-outline"
            text={[campaign.address, campaign.municipality?.name].filter(Boolean).join(', ')}
          />
          <InfoRow
            icon="clock-outline"
            text={
              campaign.end_date ? `Hasta ${formatDayMonth(campaign.end_date)}` : 'Sin fecha de fin'
            }
          />
        </View>

        {status === 'rejected' && campaign.rejection_reason && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Motivo del rechazo</Text>
            <Text style={styles.noticeText}>{campaign.rejection_reason}</Text>
          </View>
        )}

        {isAdmin && status === 'pending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revisión BAMX</Text>
            <View style={styles.actions}>
              <View style={styles.action}>
                <Button title="Rechazar" variant="outline" onPress={() => setIsRejecting(true)} />
              </View>
              <View style={styles.action}>
                <Button title="Aprobar" onPress={approve} loading={busy === 'approve'} />
              </View>
            </View>
          </View>
        )}

        {canRequestSupport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitar apoyo a BAMX</Text>
            {SUPPORT_OPTIONS.map((option) => {
              const latest = supportRequests.find((r) => matchesOption(r, option));
              const isOpen = latest?.status === 'pending' || latest?.status === 'approved';
              return (
                <View key={option.label} style={styles.supportRow}>
                  <Text style={styles.supportLabel}>{option.label}</Text>
                  {isOpen ? (
                    <StatusBadge
                      label={SUPPORT_STATUS[latest.status].label}
                      tone={SUPPORT_STATUS[latest.status].tone}
                    />
                  ) : (
                    <Pressable
                      onPress={() => setSupportOption(option)}
                      style={styles.supportButton}
                      accessibilityRole="button"
                    >
                      <Text style={styles.supportButtonText}>Solicitar</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {supportRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de apoyos</Text>
            {supportRequests.map((request) => (
              <View key={request.id} style={styles.historyRow}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyType}>{SUPPORT_TYPE_LABELS[request.type]}</Text>
                  <StatusBadge
                    label={SUPPORT_STATUS[request.status].label}
                    tone={SUPPORT_STATUS[request.status].tone}
                  />
                </View>
                <Text style={styles.historyText}>{request.description}</Text>
                {request.response_message && (
                  <Text style={styles.historyResponse}>BAMX: {request.response_message}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad</Text>
          <View style={styles.stats}>
            <StatTile label="Vistas" />
            <StatTile label="Donativos" />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {(canEdit || isLive) && (
        <View style={styles.footer}>
          {canEdit && (
            <View style={styles.action}>
              <Button
                title="Editar Campaña"
                variant="outline"
                onPress={() =>
                  router.push({ pathname: '/my-campaigns/[id]/edit', params: { id: campaign.id } })
                }
              />
            </View>
          )}
          {isLive && (
            <View style={styles.action}>
              <Button title="Finalizar" onPress={finish} loading={busy === 'finish'} />
            </View>
          )}
        </View>
      )}

      <PromptModal
        visible={supportOption !== null}
        title={`Solicitar ${supportOption?.label.toLowerCase() ?? ''}`}
        message="Describe qué necesitas y para cuándo."
        placeholder={supportOption?.placeholder}
        onClose={() => setSupportOption(null)}
        onSubmit={async (text) => {
          if (!supportOption || !user) return;
          await campaignsApi.requestSupport(
            campaign.id,
            user.id,
            supportOption.type,
            `${supportOption.prefix}${text}`,
          );
          onChanged();
        }}
      />

      <PromptModal
        visible={isRejecting}
        title="Rechazar campaña"
        message="El organizador verá este motivo y podrá corregir su información."
        placeholder="Motivo del rechazo"
        submitLabel="Rechazar"
        onClose={() => setIsRejecting(false)}
        onSubmit={async (reason) => {
          await campaignsApi.setStatus(campaign.id, user!.id, 'rejected', reason);
          onChanged();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg },
  header: { gap: spacing.sm },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { flex: 1, fontSize: 14, color: colors.text },
  notice: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerTint,
  },
  noticeTitle: { fontWeight: '600', color: colors.danger },
  noticeText: { color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 18, color: colors.text },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  supportLabel: { fontSize: 15, color: colors.text },
  supportButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  supportButtonText: { color: colors.background, fontWeight: '600' },
  historyRow: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyType: { fontWeight: '600', color: colors.text },
  historyText: { fontSize: 14, color: colors.text },
  historyResponse: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1,
    minHeight: 100,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  statLabel: { fontSize: 14, color: colors.text },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.textSecondary },
  statHint: { fontSize: 11, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  error: { color: colors.danger, textAlign: 'center' },
});
