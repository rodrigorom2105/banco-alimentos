import { Inbox } from '@/features/notifications';
import { Screen } from '@/shared/components';

export default function NotificationsScreen() {
  return (
    <Screen title="Notificaciones">
      <Inbox />
    </Screen>
  );
}
