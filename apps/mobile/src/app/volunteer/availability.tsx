import { ActivityIndicator, StyleSheet } from 'react-native';

import { AvailabilityForm, useMyApplication } from '@/features/volunteers';
import { Placeholder, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

// Solo se puede editar mientras la solicitud esté pendiente o aprobada: una rechazada se
// corrige volviendo a enviarla, y una suspendida la levanta un admin (lo valida la base).
const EDITABLE = ['pending', 'approved'];

export default function VolunteerAvailabilityScreen() {
  const { application, isLoading, error } = useMyApplication();

  return (
    <Screen title="Mi disponibilidad">
      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : !application || !EDITABLE.includes(application.validation_status) ? (
        <Placeholder
          title="No puedes editar tu disponibilidad"
          message={
            error ??
            'Tu solicitud de voluntariado tiene que estar en revisión o aprobada para poder cambiarla.'
          }
        />
      ) : (
        <AvailabilityForm application={application} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
