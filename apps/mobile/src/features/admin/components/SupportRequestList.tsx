import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, FilterChip, Placeholder, PromptModal, StatusBadge } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { adminApi } from '../api/adminApi';
import { useSupportRequestsForReview } from '../hooks/useAdminQueries';
import { SUPPORT_STATUS, SUPPORT_TYPE_LABELS } from '../labels';
import type { SupportRequestForReview, SupportStatus } from '../types';

const FILTERS: (SupportStatus | null)[] = [
  'pending',
  'approved',
  'delivered',
  'rejected',
  'cancelled',
  null,
];

type RowProps = {
  request: SupportRequestForReview;
  onApprove: () => void;
  onReject: () => void;
  onDeliver: () => void;
  busy: boolean;
};

function RequestRow({ request, onApprove, onReject, onDeliver, busy }: RowProps) {
  const status = SUPPORT_STATUS[request.status];
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.campaign} numberOfLines={1}>
          {request.campaignName}
        </Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>
      <Text style={styles.type}>{SUPPORT_TYPE_LABELS[request.type]}</Text>
      <Text style={styles.description}>{request.description}</Text>
      {request.neededBy && (
        <Text style={styles.detail}>La necesitan para el {formatDayMonth(request.neededBy)}</Text>
      )}
      {request.responseMessage && (
        <Text style={styles.response}>Tu respuesta: {request.responseMessage}</Text>
      )}

      {request.status === 'pending' && (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button title="Rechazar" variant="outline" onPress={onReject} disabled={busy} />
          </View>
          <View style={styles.action}>
            <Button title="Aprobar" onPress={onApprove} loading={busy} />
          </View>
        </View>
      )}
      {request.status === 'approved' && (
        <Button title="Marcar como entregada" onPress={onDeliver} loading={busy} />
      )}
    </View>
  );
}

export function SupportRequestList() {
  const [filter, setFilter] = useState<SupportStatus | null>('pending');
  const { requests, isLoading, error, reload } = useSupportRequestsForReview(filter);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Id de la solicitud en la que se está trabajando, para no bloquear toda la lista.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SupportRequestForReview | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const run = async (id: string, task: () => Promise<unknown>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await task();
      await reload();
    } catch (e) {
      setActionError(getErrorMessage(e, 'No se pudo completar la acción.'));
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestRow
            request={item}
            busy={busyId === item.id}
            onApprove={() => run(item.id, () => adminApi.respondSupportRequest(item.id, true, ''))}
            onReject={() => setRejecting(item)}
            onDeliver={() => run(item.id, () => adminApi.deliverSupportRequest(item.id))}
          />
        )}
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {FILTERS.map((status) => (
                <FilterChip
                  key={status ?? 'all'}
                  label={status ? SUPPORT_STATUS[status].label : 'Todas'}
                  selected={filter === status}
                  onPress={() => setFilter(status)}
                />
              ))}
            </ScrollView>
            {actionError && <Text style={styles.error}>{actionError}</Text>}
          </View>
        }
        ListEmptyComponent={
          <Placeholder
            title={error ? 'No se pudieron cargar las solicitudes' : 'Nada por aquí'}
            message={error ?? 'No hay solicitudes de apoyo con este estado.'}
          />
        }
      />

      <PromptModal
        visible={rejecting !== null}
        title="Rechazar solicitud de apoyo"
        message="El motivo le llega al organizador como notificación."
        placeholder="Ej. Por ahora no tenemos contenedores disponibles"
        submitLabel="Rechazar"
        onSubmit={async (message) => {
          const id = rejecting!.id;
          await adminApi.respondSupportRequest(id, false, message);
          await reload();
        }}
        onClose={() => setRejecting(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  chips: { gap: spacing.sm },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  campaign: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  type: { fontSize: 13, fontWeight: '600', color: colors.primary },
  description: { fontSize: 14, color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary },
  response: { fontSize: 13, fontStyle: 'italic', color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1 },
  error: { fontSize: 13, color: colors.danger },
});
