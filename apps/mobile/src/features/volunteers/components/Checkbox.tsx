import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

type Props = {
  checked: boolean;
  onToggle: () => void;
  // El texto va como hijo para poder meter enlaces a las pantallas legales.
  children: ReactNode;
  label: string;
};

export function Checkbox({ checked, onToggle, children, label }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        style={[styles.box, checked && styles.boxChecked]}
      >
        {checked && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
      </Pressable>
      <View style={styles.text}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: { backgroundColor: colors.primary },
  text: { flex: 1 },
});
