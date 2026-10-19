import { View } from 'react-native';

import { Text } from './Text';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

// Fondo y texto de cada tono: verde = éxito, ámbar = en espera, rojo = problema.
const TONES: Record<BadgeTone, { box: string; text: string }> = {
  neutral: { box: 'bg-carbon-50', text: 'text-carbon-500' },
  success: { box: 'bg-leaf-50', text: 'text-leaf-700' },
  warning: { box: 'bg-accent-50', text: 'text-accent-600' },
  danger: { box: 'bg-brand-50', text: 'text-brand-600' },
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${TONES[tone].box}`}>
      <Text className={`font-heading text-xs ${TONES[tone].text}`}>{label}</Text>
    </View>
  );
}
