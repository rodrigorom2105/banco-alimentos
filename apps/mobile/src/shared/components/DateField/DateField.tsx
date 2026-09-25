import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import { Button } from '../Button';
import { dateToValue, formatValue, valueToDate, type DateFieldMode } from './dateValue';

export type DateFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
  mode?: DateFieldMode;
  placeholder: string;
  minimumDate?: Date;
};

// Campo que abre el selector nativo: diálogo del sistema en Android y calendario en iOS.
export function DateField({
  value,
  onChange,
  mode = 'date',
  placeholder,
  minimumDate,
}: DateFieldProps) {
  const [draft, setDraft] = useState<Date | null>(null);

  const open = () => {
    const current = valueToDate(value, mode);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        is24Hour: true,
        minimumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(dateToValue(date, mode));
        },
      });
      return;
    }
    setDraft(current);
  };

  const confirm = () => {
    if (draft) onChange(dateToValue(draft, mode));
    setDraft(null);
  };

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        style={[styles.trigger, value ? styles.triggerFilled : null]}
      >
        <MaterialCommunityIcons
          name={mode === 'date' ? 'calendar-month-outline' : 'clock-outline'}
          size={20}
          color={value ? colors.primaryDark : colors.textSecondary}
        />
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatValue(value, mode) : placeholder}
        </Text>
      </Pressable>

      {/* iOS: el selector va dentro de una hoja inferior con botón para confirmar. */}
      <Modal
        visible={draft !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDraft(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setDraft(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            {draft && (
              <Text style={styles.sheetValue}>{formatValue(dateToValue(draft, mode), mode)}</Text>
            )}
            {draft && (
              <DateTimePicker
                value={draft}
                mode={mode}
                display={mode === 'date' ? 'inline' : 'spinner'}
                locale="es-MX"
                minimumDate={minimumDate}
                // Tema claro fijo: en modo oscuro iOS dibuja texto blanco sobre la hoja blanca.
                themeVariant="light"
                textColor={colors.text}
                accentColor={colors.primaryDark}
                onChange={(_, date) => date && setDraft(date)}
              />
            )}
            <View style={styles.actions}>
              <View style={styles.action}>
                <Button title="Cancelar" variant="outline" onPress={() => setDraft(null)} />
              </View>
              <View style={styles.action}>
                <Button title="Listo" onPress={confirm} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
    padding: spacing.md - 1.5,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  // Con fecha elegida el campo se distingue: fondo blanco, borde y texto en verde oscuro.
  triggerFilled: { borderColor: colors.primaryDark, backgroundColor: colors.background },
  value: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  placeholder: { fontWeight: '400', color: colors.textSecondary },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.background,
  },
  sheetTitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  sheetValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
