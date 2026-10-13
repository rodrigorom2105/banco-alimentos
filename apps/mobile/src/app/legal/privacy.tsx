import { LegalDocumentView, PRIVACY_NOTICE } from '@/features/volunteers';
import { Screen } from '@/shared/components';

export default function PrivacyScreen() {
  return (
    <Screen title={PRIVACY_NOTICE.title}>
      <LegalDocumentView document={PRIVACY_NOTICE} />
    </Screen>
  );
}
