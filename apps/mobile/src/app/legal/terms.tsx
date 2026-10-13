import { LegalDocumentView, VOLUNTEER_TERMS } from '@/features/volunteers';
import { Screen } from '@/shared/components';

export default function TermsScreen() {
  return (
    <Screen title={VOLUNTEER_TERMS.title}>
      <LegalDocumentView document={VOLUNTEER_TERMS} />
    </Screen>
  );
}
