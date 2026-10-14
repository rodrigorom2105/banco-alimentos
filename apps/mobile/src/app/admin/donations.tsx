import { AdminOnly, UnassignedDonationList } from '@/features/admin';
import { Screen } from '@/shared/components';

export default function AdminDonationsScreen() {
  return (
    <Screen title="Donaciones sin voluntario">
      <AdminOnly>
        <UnassignedDonationList />
      </AdminOnly>
    </Screen>
  );
}
