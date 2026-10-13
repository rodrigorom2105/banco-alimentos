import { ManagedCampaignList } from '@/features/campaigns';
import { Screen } from '@/shared/components';

export default function MyCampaignsScreen() {
  // Siempre las campañas PROPIAS, también para un admin: la lista de todas, con su bandeja de
  // revisión, vive en el Panel BAMX (/admin/campaigns). RLS filtra por organizador.
  return (
    <Screen title="Mis campañas">
      <ManagedCampaignList isAdmin={false} />
    </Screen>
  );
}
