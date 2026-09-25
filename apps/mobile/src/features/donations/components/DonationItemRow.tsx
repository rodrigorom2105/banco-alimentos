import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Input, Select } from '@/shared/components';
import type { ProductCategory } from '@/shared/lib/catalogs';
import { colors, radius, spacing } from '@/shared/theme';

import { ITEM_UNIT_LABELS, type ItemUnit } from '../labels';

export type DonationItemDraft = {
  key: string;
  categoryId: number | null;
  description: string;
  quantity: string;
  unit: ItemUnit;
};

const UNIT_OPTIONS = (Object.keys(ITEM_UNIT_LABELS) as ItemUnit[]).map((unit) => ({
  value: unit,
  label: ITEM_UNIT_LABELS[unit],
}));

type Props = {
  index: number;
  item: DonationItemDraft;
  categories: ProductCategory[];
  onChange: (item: DonationItemDraft) => void;
  onRemove?: () => void;
};

export function DonationItemRow({ index, item, categories, onChange, onRemove }: Props) {
  const category = categories.find((c) => c.id === item.categoryId);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Producto {index + 1}</Text>
        {onRemove && (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel="Quitar producto">
            <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      <Select
        value={item.categoryId}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(categoryId) => onChange({ ...item, categoryId })}
        placeholder="Tipo (ej. Enlatados)"
      />
      <Input
        variant="filled"
        value={item.description}
        onChangeText={(description) => onChange({ ...item, description })}
        placeholder={category?.description ? `Ej. ${category.description}` : 'Alimento'}
      />
      <View style={styles.quantityRow}>
        <Input
          variant="filled"
          value={item.quantity}
          onChangeText={(quantity) => onChange({ ...item, quantity })}
          placeholder="Cantidad (ej. 10)"
          keyboardType="decimal-pad"
          style={styles.quantity}
        />
        <View style={styles.unit}>
          <Select
            value={item.unit}
            options={UNIT_OPTIONS}
            onChange={(unit) => onChange({ ...item, unit })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 13, color: colors.textSecondary },
  quantityRow: { flexDirection: 'row', gap: spacing.sm },
  quantity: { flex: 1, minWidth: 0 },
  unit: { width: 130 },
});
