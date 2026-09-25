import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

export type SelectOption<T> = { value: T; label: string };

type Props<T> = {
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

// Desplegable propio: abre un modal con las opciones. Funciona igual en Android, iOS y web.
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled,
  accessibilityLabel,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        style={[styles.trigger, disabled && styles.disabled]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        {!disabled && (
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  disabled: { opacity: 0.7 },
  value: { flex: 1, fontSize: 16, color: colors.text },
  placeholder: { color: colors.textSecondary },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '70%',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: { backgroundColor: colors.surface },
  optionText: { fontSize: 16, color: colors.text },
});
