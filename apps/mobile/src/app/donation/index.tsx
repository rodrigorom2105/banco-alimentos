import { MyDonationList } from '@/features/donations';
import { Screen } from '@/shared/components';

export default function MyDonationsScreen() {
  return (
    <Screen title="Mis donaciones">
      <MyDonationList />
    </Screen>
  );
}
