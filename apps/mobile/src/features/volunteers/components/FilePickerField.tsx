import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/shared/theme';

import type { PickedFile } from '../types';

type Action = { label: string; onPress: () => void };

type Props = {
  file: PickedFile | null;
  // Vista previa en miniatura (solo tiene sentido para la foto; un PDF no se puede dibujar).
  showPreview?: boolean;
  actions: Action[];
  onClear: () => void;
};

const kilobytes = (bytes: number | null) =>
  bytes === null ? null : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Caja para elegir un archivo. Sin archivo muestra los botones; con archivo muestra qué se
// eligió y permite quitarlo o cambiarlo.
export function FilePickerField({ file, showPreview, actions, onClear }: Props) {
  if (!file) {
    return (
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const size = kilobytes(file.size);

  return (
    <View style={styles.chosen}>
      {showPreview ? (
        <Image source={{ uri: file.uri }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumb}>
          <MaterialCommunityIcons name="file-document-outline" size={26} color={colors.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {file.name}
        </Text>
        {size && <Text style={styles.size}>{size}</Text>}
      </View>
      <Pressable
        onPress={onClear}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${file.name}`}
      >
        <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  actionText: { color: colors.primary, fontFamily: fonts.heading },
  chosen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, color: colors.text },
  size: { fontSize: 12, color: colors.textSecondary },
});
