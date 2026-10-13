import { CampaignForm } from '@/features/campaigns';
import { Screen } from '@/shared/components';

export default function NewCampaignScreen() {
  // Cualquier usuario con sesión puede registrar una campaña comunitaria; la revisión del
  // admin es la que valida (decisión 3 del plan). Ya no hace falta consultar el rol: el
  // formulario siempre crea campañas comunitarias.
  return (
    <Screen title="Nueva campaña">
      <CampaignForm />
    </Screen>
  );
}
