import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: Props) {
  return (
    <View
      className="w-[90%] items-center rounded-card bg-white p-6 shadow-lg shadow-black/10"
      style={style}
    >
      {children}
    </View>
  );
}
