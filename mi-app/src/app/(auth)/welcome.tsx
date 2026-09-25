import { StyleSheet, View } from 'react-native';

import { WelcomeCarousel } from '@/features/auth';
import { colors } from '@/shared/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <WelcomeCarousel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
