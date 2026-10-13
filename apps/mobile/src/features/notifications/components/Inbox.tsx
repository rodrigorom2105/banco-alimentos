import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Placeholder } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';

import { notificationsApi } from '../api/notificationsApi';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelative, NOTIFICATION_ICONS } from '../labels';
import { hrefFor } from '../navigation';
import type { Notification } from '../types';

function NotificationRow({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const isUnread = !notification.read_at;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, isUnread && styles.unreadRow, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons
        name={NOTIFICATION_ICONS[notification.type]}
        size={22}
        color={isUnread ? colors.primary : colors.textSecondary}
      />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>{formatRelative(notification.created_at)}</Text>
        </View>
        <Text style={styles.body}>{notification.body}</Text>
      </View>
      {isUnread && <View style={styles.dot} />}
    </Pressable>
  );
}

export function Inbox() {
  const { notifications, isLoading, error, reload } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  // Marcar como leída y navegar. Si falla el marcado no se cancela la navegación: el usuario
  // igual quiere llegar a su campaña, y la próxima vez se reintenta.
  const open = async (notification: Notification) => {
    const href = hrefFor(notification);
    if (!notification.read_at) {
      await notificationsApi.markRead(notification.id).catch(() => {});
      await reload();
    }
    if (href) router.push(href);
  };

  const markAll = async () => {
    await notificationsApi.markAllRead();
    await reload();
  };

  if (isLoading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  if (error) {
    return <Placeholder title="No se pudieron cargar tus avisos" message={error} />;
  }

  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationRow notification={item} onPress={() => open(item)} />}
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        hasUnread ? (
          <Pressable onPress={markAll} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.markAll}>Marcar todas como leídas</Text>
          </Pressable>
        ) : null
      }
      ListEmptyComponent={
        <Placeholder
          title="Sin notificaciones"
          message="Aquí vas a ver los avisos de tus campañas, tu voluntariado y tus donaciones."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  markAll: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  unreadRow: { backgroundColor: colors.surface, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  rowBody: { flex: 1, gap: 2 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 15, color: colors.text },
  titleUnread: { fontWeight: '700' },
  time: { fontSize: 12, color: colors.textSecondary },
  body: { fontSize: 13, color: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
