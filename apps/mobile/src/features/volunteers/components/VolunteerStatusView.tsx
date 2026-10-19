import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MyPickupList } from '@/features/pickups';
import { Button } from '@/shared/components';
import { useMunicipalities } from '@/shared/hooks';
import { colors, radius, spacing } from '@/shared/theme';
import { formatDayMonth } from '@/shared/utils';

import { WEEKDAY_LABELS } from '../labels';
import type { MyVolunteerApplication } from '../types';

type Props = {
  application: MyVolunteerApplication;
  // Solo se usa cuando la solicitud fue rechazada.
  onResubmit: () => void;
  onEditAvailability: () => void;
};

const hour = (time: string) => time.slice(0, 5);

function Card({
  icon,
  tone,
  title,
  children,
}: {
  icon: 'clock-outline' | 'close-circle-outline' | 'pause-circle-outline' | 'check-circle-outline';
  tone: 'neutral' | 'danger' | 'success';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, styles[tone]]}>
      <MaterialCommunityIcons
        name={icon}
        size={36}
        color={tone === 'danger' ? colors.danger : colors.primary}
      />
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * Qué ve el usuario en "Mi voluntariado" según el estado de su solicitud. La pantalla del
 * voluntario aprobado (recolecciones y ruta) llega en la Fase 9; por ahora se le confirma que
 * está dentro y se le muestra lo que declaró.
 */
export function VolunteerStatusView({ application, onResubmit, onEditAvailability }: Props) {
  const { items: municipalities } = useMunicipalities();
  const canEditAvailability =
    application.validation_status === 'pending' || application.validation_status === 'approved';
  const covered = municipalities
    .filter((m) => application.municipalityIds.includes(m.id))
    .map((m) => m.name);
  const sentOn = formatDayMonth(application.created_at.slice(0, 10));

  const availability = `${application.available_days
    .map((d) => WEEKDAY_LABELS[d])
    .join(', ')} · ${hour(application.available_from)} a ${hour(application.available_to)}`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {application.validation_status === 'pending' && (
        <Card icon="clock-outline" tone="neutral" title="Tu solicitud está en revisión">
          <Text style={styles.text}>
            La enviaste el {sentOn}. BAMX revisa tus datos y te avisamos en cuanto haya respuesta;
            te va a llegar una notificación.
          </Text>
        </Card>
      )}

      {application.validation_status === 'rejected' && (
        <Card icon="close-circle-outline" tone="danger" title="Tu solicitud no fue aprobada">
          <Text style={styles.label}>Motivo</Text>
          <Text style={styles.text}>{application.rejection_reason ?? 'Sin motivo indicado.'}</Text>
          <Text style={styles.text}>
            Puedes corregir lo que haga falta y volver a enviarla. Tus datos quedan precargados.
          </Text>
          <Button title="Volver a enviar" onPress={onResubmit} />
        </Card>
      )}

      {application.validation_status === 'suspended' && (
        <Card icon="pause-circle-outline" tone="danger" title="Tu voluntariado está suspendido">
          <Text style={styles.label}>Motivo</Text>
          <Text style={styles.text}>{application.rejection_reason ?? 'Sin motivo indicado.'}</Text>
          <Text style={styles.text}>
            No puedes recibir recolecciones por ahora. Si crees que es un error, comunícate con
            BAMX.
          </Text>
        </Card>
      )}

      {/* Aprobado no lleva tarjeta de bienvenida: la felicitación se dio una vez, por
          notificación, el día que lo aprobaron. Dejarla fija aquí para siempre ocupa la
          pantalla con algo que ya sabe, encima de lo que de verdad viene a ver. Su lista de
          recolecciones ya explica qué sigue cuando está vacía. La ruta del día y los pasos de
          la recolección llegan en la Fase 9. */}
      {application.validation_status === 'approved' && <MyPickupList />}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Lo que registraste</Text>
        <Text style={styles.label}>Disponibilidad</Text>
        <Text style={[styles.text, styles.left]}>{availability}</Text>
        <Text style={styles.label}>Municipios</Text>
        <Text style={[styles.text, styles.left]}>
          {covered.length > 0 ? covered.join(', ') : 'Sin municipios registrados'}
        </Text>
        {/* Editable mientras esté en revisión o aprobado. De esto depende qué recolecciones se
            le proponen, así que tiene que poder corregirlo sin pedirle nada a nadie. */}
        {canEditAvailability && (
          <View style={styles.summaryAction}>
            <Button title="Editar disponibilidad" variant="outline" onPress={onEditAvailability} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  neutral: { borderColor: colors.border, backgroundColor: colors.background },
  success: { borderColor: colors.success, backgroundColor: colors.successTint },
  danger: { borderColor: colors.danger, backgroundColor: colors.dangerTint },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  text: { fontSize: 14, lineHeight: 20, color: colors.text, textAlign: 'center' },
  left: { textAlign: 'left' },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  summary: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  summaryAction: { marginTop: spacing.md },
});
