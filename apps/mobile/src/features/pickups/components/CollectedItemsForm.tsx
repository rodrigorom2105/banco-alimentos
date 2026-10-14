import { StyleSheet, Text, View } from 'react-native';

import { Field, Input } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { ITEM_UNIT_LABELS } from '../labels';
import type { PickupItem } from '../types';

type Props = {
  items: PickupItem[];
  // Lo capturado por id de producto, como texto: un campo numérico vacío no es 0, es "sin
  // llenar", y distinguirlo es lo que permite exigir que no falte ninguno.
  values: Record<string, string>;
  onChange: (itemId: string, value: string) => void;
  error?: string;
};

/**
 * Cuánto se recolectó de cada producto.
 *
 * Se piden todos y se precargan con lo que el donador declaró, porque lo normal es que
 * coincida: así el voluntario solo corrige lo que cambió. Puede ser menos, o cero si al final
 * no tenía ese producto.
 */
export function CollectedItemsForm({ items, values, onChange, error }: Props) {
  return (
    <Field label="¿Cuánto recolectaste?" error={error}>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.label}>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.declared}>
                Declarado: {item.quantity} {ITEM_UNIT_LABELS[item.unit]}
              </Text>
            </View>
            <View style={styles.input}>
              <Input
                variant="filled"
                value={values[item.id] ?? ''}
                onChangeText={(value) => onChange(item.id, value)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          </View>
        ))}
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { flex: 1, gap: 2 },
  description: { fontSize: 14, color: colors.text },
  declared: { fontSize: 12, color: colors.textSecondary },
  // minWidth 0: sin esto, en web el campo no se encoge y la fila se sale de la pantalla.
  input: { width: 96, minWidth: 0 },
});
