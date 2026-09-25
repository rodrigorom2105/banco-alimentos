import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors, spacing } from '@/shared/theme';

type Props = {
  count: number;
  scrollX: Animated.Value;
};

export function Paginator({ count, scrollX }: Props) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 20, 10],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        return <Animated.View key={index} style={[styles.dot, { width: dotWidth, opacity }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', height: 64 },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.primary,
  },
});
