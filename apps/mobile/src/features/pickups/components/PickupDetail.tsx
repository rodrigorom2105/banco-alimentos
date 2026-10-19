import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, PromptModal, StatusBadge } from '@/shared/components';
import { useAuth } from '@/providers';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, fonts, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { pickupsApi } from '../api/pickupsApi';
import { ITEM_UNIT_LABELS, pickupStatus } from '../labels';
import { takeEvidencePhoto } from '../pickers';
import { isOffer, nextStep, type CollectedItem, type MyPickup } from '../types';
import { CollectedItemsForm } from './CollectedItemsForm';

const hour = (time: string) => time.slice(0, 5);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

// Lo declarado por el donador, como texto, para precargar el formulario de cantidades.
const declaredQuantities = (pickup: MyPickup) =>
  Object.fromEntries(
    pickup.request.items.map((item) => [item.id, String(item.collectedQuantity ?? item.quantity)]),
  );

/**
 * Una recolección y su siguiente paso.
 *
 * El botón principal es siempre uno: el paso que toca. Mostrar los cuatro y deshabilitar tres
 * obligaría al voluntario a decidir qué puede hacer, cuando el estado ya lo decide.
 */
export function PickupDetail({ pickup, onChanged }: { pickup: MyPickup; onChanged: () => void }) {
  const { user } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, string>>(declaredQuantities(pickup));
  const [isBusy, setIsBusy] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = pickupStatus(pickup.status, pickup.acceptedAt !== null);
  const step = nextStep(pickup);
  // La notificación "tienes una recolección por confirmar" trae a esta pantalla, así que
  // aceptar y rechazar también tienen que estar aquí: si no, el aviso llevaría a un callejón.
  const offer = isOffer(pickup);
  const { request } = pickup;

  const run = async (task: () => Promise<unknown>) => {
    setIsBusy(true);
    setError(null);
    try {
      await task();
      onChanged();
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo completar la acción.'));
    } finally {
      setIsBusy(false);
    }
  };

  const collect = () => {
    const items: CollectedItem[] = [];
    for (const item of request.items) {
      const value = Number(quantities[item.id]);
      if (!(quantities[item.id] ?? '').trim() || Number.isNaN(value) || value < 0) {
        setError('Escribe cuánto recolectaste de cada producto (0 o más).');
        return;
      }
      items.push({ itemId: item.id, collectedQuantity: value });
    }
    void run(() => pickupsApi.collect(pickup.id, items));
  };

  // La foto se toma al entregar, en el centro de acopio: es el comprobante de que el donativo
  // llegó a su destino. Si el voluntario cancela la cámara no se hace nada.
  const deliver = async () => {
    const uri = await takeEvidencePhoto();
    if (!uri || !user) return;
    void run(() => pickupsApi.deliver(pickup.id, user.id, uri));
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.date}>{formatDayMonth(request.preferredDate)}</Text>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>

        <View style={styles.card}>
          <Row label="Quien dona" value={request.donorName} />
          {request.donorPhone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${request.donorPhone}`)}
              accessibilityRole="button"
              style={styles.call}
            >
              <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
              <Text style={styles.callText}>{request.donorPhone}</Text>
            </Pressable>
          )}
          <Row
            label="Horario"
            value={`${hour(request.preferredTimeFrom)} a ${hour(request.preferredTimeTo)}`}
          />
          <Row label="Recoger en" value={`${request.address}, ${request.municipalityName}`} />
          {request.addressReferences && (
            <Row label="Referencias" value={request.addressReferences} />
          )}
          {request.notes && <Row label="Notas" value={request.notes} />}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entregar en</Text>
          <Text style={styles.value}>{pickup.destination.name}</Text>
          <Text style={styles.declared}>{pickup.destination.address}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Productos</Text>
          {request.items.map((item) => (
            <View key={item.id} style={styles.field}>
              <Text style={styles.value}>{item.description}</Text>
              <Text style={styles.declared}>
                {item.quantity} {ITEM_UNIT_LABELS[item.unit]}
                {item.collectedQuantity !== null &&
                  ` · recolectado: ${item.collectedQuantity} ${ITEM_UNIT_LABELS[item.unit]}`}
              </Text>
            </View>
          ))}
        </View>

        {step === 'collect' && (
          <CollectedItemsForm
            items={request.items}
            values={quantities}
            onChange={(itemId, value) => setQuantities((prev) => ({ ...prev, [itemId]: value }))}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {offer && (
          <>
            <Text style={styles.declared}>
              Confírmala pronto: si no contestas, el donativo se le ofrece a otro voluntario.
            </Text>
            <View style={styles.actions}>
              <View style={styles.action}>
                <Button
                  title="Rechazar"
                  variant="outline"
                  onPress={() => setIsDeclining(true)}
                  disabled={isBusy}
                />
              </View>
              <View style={styles.action}>
                <Button
                  title="Aceptar"
                  onPress={() => run(() => pickupsApi.accept(pickup.id))}
                  loading={isBusy}
                />
              </View>
            </View>
          </>
        )}

        {step === 'start' && (
          <Button
            title="Voy en camino"
            onPress={() => run(() => pickupsApi.start(pickup.id))}
            loading={isBusy}
          />
        )}
        {step === 'collect' && (
          <Button title="Ya lo recolecté" onPress={collect} loading={isBusy} />
        )}
        {step === 'deliver' && (
          <Button title="Entregué: tomar foto" onPress={deliver} loading={isBusy} />
        )}

        {/* Cancelar solo antes de recoger: después el donativo ya está en sus manos y
            cancelar no lo devuelve a casa del donador. */}
        {(pickup.status === 'assigned' || pickup.status === 'on_the_way') &&
          pickup.acceptedAt !== null && (
            <Button
              title="No voy a poder"
              variant="outline"
              onPress={() => setIsCancelling(true)}
              disabled={isBusy}
            />
          )}
      </ScrollView>

      <PromptModal
        visible={isCancelling}
        title="Cancelar la recolección"
        message="Se le va a avisar a quien dona y buscaremos a otro voluntario. Cuéntanos qué pasó."
        placeholder="Ej. Se me averió el carro"
        submitLabel="Cancelar recolección"
        onSubmit={async (reason) => {
          await pickupsApi.cancel(pickup.id, reason);
          // Ya no es suya, así que no tiene sentido quedarse en su detalle.
          router.back();
        }}
        onClose={() => setIsCancelling(false)}
      />

      <PromptModal
        visible={isDeclining}
        title="Rechazar la recolección"
        message="El donativo se le va a ofrecer a otro voluntario. Cuéntanos por qué no puedes para que BAMX lo tome en cuenta."
        placeholder="Ej. Me queda muy lejos de mi zona"
        submitLabel="Rechazar"
        onSubmit={async (reason) => {
          await pickupsApi.decline(pickup.id, reason);
          router.back();
        }}
        onClose={() => setIsDeclining(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { flex: 1, fontSize: 18, fontFamily: fonts.heading, color: colors.text },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: { fontSize: 16, fontFamily: fonts.heading, color: colors.text },
  field: { gap: 2 },
  label: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 15, color: colors.text },
  declared: { fontSize: 13, color: colors.textSecondary },
  call: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  callText: { fontSize: 15, fontFamily: fonts.heading, color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1, minWidth: 0 },
  error: { fontSize: 13, color: colors.danger, textAlign: 'center' },
});
