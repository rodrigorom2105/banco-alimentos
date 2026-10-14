import { StyleSheet, View } from 'react-native';

import { DateField, Field, FilterChip } from '@/shared/components';
import { useMunicipalities } from '@/shared/hooks';
import { spacing } from '@/shared/theme';

import { WEEKDAY_LABELS, WEEKDAYS } from '../labels';
import type { AvailabilityDraft, Weekday } from '../types';
import type { AvailabilityErrors } from '../validation';

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

type Props = {
  value: AvailabilityDraft;
  onChange: (changes: Partial<AvailabilityDraft>) => void;
  errors: AvailabilityErrors;
};

/**
 * Municipios, días y horario: cuándo y dónde puede recoger el voluntario.
 *
 * Están aquí y no dentro de cada formulario porque se piden en dos lugares —al enviar la
 * solicitud y al corregirla— y son justo los datos con los que la Fase 8 lo elige. Si los dos
 * formularios se escribieran por separado, tarde o temprano uno validaría algo que el otro no.
 */
export function AvailabilityFields({ value, onChange, errors }: Props) {
  const { items: municipalities, error: municipalitiesError } = useMunicipalities();

  return (
    <>
      <Field
        label="Municipios donde puedes recoger"
        error={errors.municipalities ?? municipalitiesError ?? undefined}
      >
        <View style={styles.chips}>
          {municipalities.map((municipality) => (
            <FilterChip
              key={municipality.id}
              label={municipality.name}
              selected={value.municipalityIds.includes(municipality.id)}
              onPress={() =>
                onChange({ municipalityIds: toggle(value.municipalityIds, municipality.id) })
              }
            />
          ))}
        </View>
      </Field>

      <Field label="Días disponibles" error={errors.days}>
        <View style={styles.chips}>
          {WEEKDAYS.map((day: Weekday) => (
            <FilterChip
              key={day}
              label={WEEKDAY_LABELS[day]}
              selected={value.days.includes(day)}
              onPress={() => onChange({ days: toggle(value.days, day) })}
            />
          ))}
        </View>
      </Field>

      <Field label="Horario" error={errors.time} hint="El mismo para todos los días que elegiste.">
        <View style={styles.row}>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={value.from || null}
              onChange={(from) => onChange({ from })}
              placeholder="Desde"
            />
          </View>
          <View style={styles.flex}>
            <DateField
              mode="time"
              value={value.to || null}
              onChange={(to) => onChange({ to })}
              placeholder="Hasta"
            />
          </View>
        </View>
      </Field>
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  // minWidth 0: sin esto, en web los campos no se encogen y la fila se sale de la pantalla.
  flex: { flex: 1, minWidth: 0 },
});
