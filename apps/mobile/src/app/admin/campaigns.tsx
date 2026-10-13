import { AdminOnly } from '@/features/admin';
import { ManagedCampaignList } from '@/features/campaigns';
import { Screen } from '@/shared/components';

export default function AdminCampaignsScreen() {
  return (
    <Screen title="Campañas">
      <AdminOnly>
        <ManagedCampaignList isAdmin />
      </AdminOnly>
    </Screen>
  );
}
