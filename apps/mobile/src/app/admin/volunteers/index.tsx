import { AdminOnly, VolunteerList } from '@/features/admin';
import { Screen } from '@/shared/components';

export default function AdminVolunteersScreen() {
  return (
    <Screen title="Voluntarios">
      <AdminOnly>
        <VolunteerList />
      </AdminOnly>
    </Screen>
  );
}
