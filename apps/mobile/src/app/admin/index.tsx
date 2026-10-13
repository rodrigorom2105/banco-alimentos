import { AdminMenu, AdminOnly } from '@/features/admin';
import { Screen } from '@/shared/components';

export default function AdminHomeScreen() {
  return (
    <Screen title="Panel BAMX">
      <AdminOnly>
        <AdminMenu />
      </AdminOnly>
    </Screen>
  );
}
