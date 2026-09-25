import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/shared/theme';

type Props = {
  count: number;
  onPress?: () => void;
};

export function NotificationBell({ count, onPress }: Props) {
  const label = count > 0 ? `Notificaciones, ${count} sin leer` : 'Notificaciones';
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.circle}>
        <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
      </View>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.danger,
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: colors.background },
});
