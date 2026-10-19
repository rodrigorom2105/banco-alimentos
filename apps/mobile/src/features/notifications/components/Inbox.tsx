import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Placeholder, Text } from '@/shared/components';
import { colors } from '@/shared/theme';

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
      className={`flex-row items-start gap-3 rounded-card border bg-white p-4 active:bg-carbon-50 ${
        isUnread ? 'border-brand-500' : 'border-line'
      }`}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-full ${
          isUnread ? 'bg-brand-50' : 'bg-carbon-50'
        }`}
      >
        <MaterialCommunityIcons
          name={NOTIFICATION_ICONS[notification.type]}
          size={22}
          color={isUnread ? colors.primary : colors.textSecondary}
        />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            className={`flex-1 text-[15px] text-carbon-900 ${
              isUnread ? 'font-heading' : 'font-body-medium'
            }`}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text className="font-body text-xs text-carbon-500">
            {formatRelative(notification.created_at)}
          </Text>
        </View>
        <Text className="font-body text-[13px] leading-[18px] text-carbon-500">
          {notification.body}
        </Text>
      </View>
      {isUnread && <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />}
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

  if (isLoading) {
    return (
      <ActivityIndicator
        style={{ flex: 1, backgroundColor: colors.background }}
        color={colors.primary}
      />
    );
  }

  if (error) {
    return <Placeholder title="No se pudieron cargar tus avisos" message={error} />;
  }

  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationRow notification={item} onPress={() => open(item)} />}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        hasUnread ? (
          <Pressable onPress={markAll} accessibilityRole="button" hitSlop={8}>
            <Text className="self-end py-1 font-heading text-[13px] text-brand-500">
              Marcar todas como leídas
            </Text>
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
