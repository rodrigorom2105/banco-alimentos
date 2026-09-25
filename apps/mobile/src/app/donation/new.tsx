import { DonationForm } from '@/features/donations';
import { Screen } from '@/shared/components';

export default function NewDonationScreen() {
  return (
    <Screen title="Donación desde hogar">
      <DonationForm />
    </Screen>
  );
}
