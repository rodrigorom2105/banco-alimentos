import { AdminOnly, CenterForm } from '@/features/admin';
import { Screen } from '@/shared/components';

export default function NewCenterScreen() {
  return (
    <Screen title="Nuevo Centro BAMX">
      <AdminOnly>
        <CenterForm />
      </AdminOnly>
    </Screen>
  );
}
