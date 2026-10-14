import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, PromptModal, StatusBadge } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth, todayISO } from '@/shared/utils';

import { pickupsApi } from '../api/pickupsApi';
import { useMyPickups, usePickupSummary } from '../hooks/useMyPickups';
import { pickupStatus } from '../labels';
import { currentLocation } from '../pickers';
import { isOffer, type MyPickup } from '../types';

const hour = (time: string) => time.slice(0, 5);

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.counter}>
      <Text style={styles.counterValue}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
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

  // Una propuesta se contesta aquí mismo; una ya confirmada se abre para ejecutarla.
  const open = () =>
    router.push({ pathname: '/volunteer/pickups/[id]', params: { id: pickup.id } });

  return (
    <Pressable
      onPress={offer ? undefined : open}
      accessibilityRole={offer ? undefined : 'button'}
      style={({ pressed }) => [styles.card, offer && styles.offer, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{formatDayMonth(request.preferredDate)}</Text>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>

      <Text style={styles.detail}>
        {hour(request.preferredTimeFrom)} a {hour(request.preferredTimeTo)}
      </Text>
      <Text style={styles.detail} numberOfLines={1}>
        {request.address}, {request.municipalityName}
      </Text>
      <Text style={styles.detail} numberOfLines={1}>
        Entregar en {pickup.destination.name}
      </Text>

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
        <Text style={styles.open}>Toca para ver y avanzar →</Text>
      )}
    </Pressable>
  );
}

/**
 * El panel del voluntario aprobado: sus contadores, la ruta del día y sus recolecciones.
 *
 * Primero las que tiene que confirmar, porque son las que vencen; después las que ya aceptó.
 */
export function MyPickupList() {
  const { pickups, isLoading, error, reload } = useMyPickups(true);
  const { summary, reload: reloadSummary } = usePickupSummary(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declining, setDeclining] = useState<MyPickup | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpeningRoute, setIsOpeningRoute] = useState(false);

  const offers = pickups.filter(isOffer);
  const confirmed = pickups.filter((p) => !isOffer(p));
  const today = todayISO();
  const hasRouteToday = confirmed.some((p) => p.request.preferredDate === today);

  const refresh = async () => {
    await Promise.all([reload(), reloadSummary()]);
  };

  const accept = async (pickup: MyPickup) => {
    setBusyId(pickup.id);
    setActionError(null);
    try {
      await pickupsApi.accept(pickup.id);
      await refresh();
    } catch (e) {
      setActionError(getErrorMessage(e, 'No se pudo confirmar la recolección.'));
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Abre la ruta del día en Google Maps.
   *
   * La ubicación es opcional: si no da permiso, el backend ordena las paradas desde la primera
   * por horario y Maps arranca donde esté el celular.
   */
  const openRoute = async () => {
    setIsOpeningRoute(true);
    setActionError(null);
    try {
      const { mapsUrl } = await pickupsApi.route(today, await currentLocation());
      if (!mapsUrl) {
        setActionError('No tienes recolecciones confirmadas para hoy.');
        return;
      }
      await Linking.openURL(mapsUrl);
    } catch (e) {
      setActionError(getErrorMessage(e, 'No se pudo abrir la ruta.'));
    } finally {
      setIsOpeningRoute(false);
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.counters}>
          <Counter value={summary.active} label="Asignadas" />
          <Counter value={summary.deliveredThisMonth} label="Entregadas este mes" />
        </View>

        {hasRouteToday && (
          <Button title="Ver ruta de hoy" onPress={openRoute} loading={isOpeningRoute} />
        )}

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
          await refresh();
        }}
        onClose={() => setDeclining(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.lg },
  container: { gap: spacing.sm },
  counters: { flexDirection: 'row', gap: spacing.sm },
  counter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  counterLabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
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
  pressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary },
  deadline: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
  open: { fontSize: 13, fontWeight: '600', color: colors.primary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1 },
  empty: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  error: { fontSize: 13, color: colors.danger },
});
