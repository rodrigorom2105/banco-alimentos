import { AdminOnly, SupportRequestList } from '@/features/admin';
import { Screen } from '@/shared/components';

export default function AdminSupportScreen() {
  return (
    <Screen title="Solicitudes de apoyo">
      <AdminOnly>
        <SupportRequestList />
      </AdminOnly>
    </Screen>
  );
}
