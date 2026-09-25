import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';
import {
  displayDateToISO,
  displayTimeToSQL,
  isoToDisplayDate,
  maskDateInput,
  maskTimeInput,
} from '@/shared/utils';

import type { DateFieldProps } from './DateField';

// El selector nativo no existe en web: ahí se escribe la fecha (dd/mm/aaaa) o la hora (HH:MM).
export function DateField({ value, onChange, mode = 'date', placeholder }: DateFieldProps) {
  const [text, setText] = useState(mode === 'date' ? isoToDisplayDate(value) : (value ?? ''));

  const handleChange = (input: string) => {
    const masked = mode === 'date' ? maskDateInput(input) : maskTimeInput(input);
    setText(masked);
    const parsed =
      mode === 'date' ? displayDateToISO(masked) : displayTimeToSQL(masked)?.slice(0, 5);
    // Mientras no sea válido se manda vacío, así el formulario marca el error al enviar.
    onChange(parsed ?? '');
  };

  return (
    <View style={[styles.container, value ? styles.filled : null]}>
      <MaterialCommunityIcons
        name={mode === 'date' ? 'calendar-month-outline' : 'clock-outline'}
        size={20}
        color={value ? colors.primaryDark : colors.textSecondary}
      />
      <TextInput
        value={text}
        onChangeText={handleChange}
        placeholder={mode === 'date' ? `${placeholder} dd/mm/aaaa` : `${placeholder} HH:MM`}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  filled: { borderColor: colors.primaryDark, backgroundColor: colors.background },
  input: { flex: 1, minWidth: 0, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
});
