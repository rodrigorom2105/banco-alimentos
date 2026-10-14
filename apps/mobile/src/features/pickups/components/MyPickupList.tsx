import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button, PromptModal, StatusBadge } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { pickupsApi } from '../api/pickupsApi';
import { useMyPickups } from '../hooks/useMyPickups';
import { ITEM_UNIT_LABELS, pickupStatus } from '../labels';
import { isOffer, type MyPickup } from '../types';

const hour = (time: string) => time.slice(0, 5);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

type CardProps = {
  pickup: MyPickup;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

function PickupCard({ pickup, busy, onAccept, onDecline }: CardProps) {
  const offer = isOffer(pickup);
  const status = pickupStatus(pickup.status, pickup.acceptedAt !== null);
  const { request } = pickup;

  return (
    <View style={[styles.card, offer && styles.offer]}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{formatDayMonth(request.preferredDate)}</Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>

      <Row
        label="Horario"
        value={`${hour(request.preferredTimeFrom)} a ${hour(request.preferredTimeTo)}`}
      />
      {/* El domicilio exacto se muestra porque la base ya se lo permite al voluntario asignado;
          sin él no podría decidir si le queda en el camino. */}
      <Row label="Recoger en" value={`${request.address}, ${request.municipalityName}`} />
      {request.addressReferences && <Row label="Referencias" value={request.addressReferences} />}
      <Row
        label="Entregar en"
        value={`${pickup.destination.name} · ${pickup.destination.address}`}
      />
      {request.items.length > 0 && (
        <Row
          label="Productos"
          value={request.items
            .map((i) => `${i.description} (${i.quantity} ${ITEM_UNIT_LABELS[i.unit]})`)
            .join(', ')}
        />
      )}
      {request.notes && <Row label="Notas del donador" value={request.notes} />}

      {offer ? (
        <>
          <Text style={styles.deadline}>
            Confírmala pronto: si no contestas, el donativo se le ofrece a otro voluntario.
          </Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title="Rechazar" variant="outline" onPress={onDecline} disabled={busy} />
            </View>
            <View style={styles.action}>
              <Button title="Aceptar" onPress={onAccept} loading={busy} />
            </View>
          </View>
        </>
      ) : (
        // Avanzar la recolección (voy en camino, recolectado, entregado) y la ruta del día
        // llegan en la Fase 9.
        <Text style={styles.note}>
          Ya confirmaste esta recolección. Pasa por el donativo en la fecha y el horario indicados.
        </Text>
      )}
    </View>
  );
}

/**
 * Las recolecciones del voluntario aprobado: primero las que tiene que confirmar y después las
 * que ya aceptó.
 */
export function MyPickupList() {
  const { pickups, isLoading, error, reload } = useMyPickups(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declining, setDeclining] = useState<MyPickup | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const offers = pickups.filter(isOffer);
  const confirmed = pickups.filter((p) => !isOffer(p));

  const accept = async (pickup: MyPickup) => {
    setBusyId(pickup.id);
    setActionError(null);
    try {
      await pickupsApi.accept(pickup.id);
      await reload();
    } catch (e) {
      setActionError(getErrorMessage(e, 'No se pudo confirmar la recolección.'));
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <>
      <View style={styles.container}>
        {actionError && <Text style={styles.error}>{actionError}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {pickups.length === 0 && !error && (
          <Text style={styles.empty}>
            Todavía no tienes recolecciones. Te avisamos con una notificación en cuanto te
            propongamos la primera.
          </Text>
        )}

        {offers.length > 0 && <Text style={styles.sectionTitle}>Por confirmar</Text>}
        {offers.map((pickup) => (
          <PickupCard
            key={pickup.id}
            pickup={pickup}
            busy={busyId === pickup.id}
            onAccept={() => accept(pickup)}
            onDecline={() => setDeclining(pickup)}
          />
        ))}

        {confirmed.length > 0 && <Text style={styles.sectionTitle}>Mis recolecciones</Text>}
        {confirmed.map((pickup) => (
          <PickupCard
            key={pickup.id}
            pickup={pickup}
            busy={busyId === pickup.id}
            onAccept={() => accept(pickup)}
            onDecline={() => setDeclining(pickup)}
          />
        ))}
      </View>

      <PromptModal
        visible={declining !== null}
        title="Rechazar la recolección"
        message="El donativo se le va a ofrecer a otro voluntario. Cuéntanos por qué no puedes para que BAMX lo tome en cuenta."
        placeholder="Ej. Me queda muy lejos de mi zona"
        submitLabel="Rechazar"
        onSubmit={async (reason) => {
          await pickupsApi.decline(declining!.id, reason);
          await reload();
        }}
        onClose={() => setDeclining(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.lg },
  container: { gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // La propuesta por confirmar se distingue: es lo único que pide una decisión.
  offer: { borderColor: colors.primary, backgroundColor: colors.backgroundTint },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  field: { gap: 2 },
  label: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 14, color: colors.text },
  deadline: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
  note: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1 },
  empty: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  error: { fontSize: 13, color: colors.danger },
});
