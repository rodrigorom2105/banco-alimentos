import { HelpHub } from '@/features/help';
import { Screen } from '@/shared/components';

export default function HelpScreen() {
  return (
    <Screen title="¿Cómo puedo ayudar?" showBack={false}>
      <HelpHub />
    </Screen>
  );
}
