import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthScreen, RegisterForm } from '@/features/auth';
import { spacing } from '@/shared/theme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <AuthScreen>
        <View style={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
          <RegisterForm />
        </View>
      </AuthScreen>
      <Pressable
        style={[styles.back, { top: insets.top + spacing.sm }]}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
        hitSlop={spacing.sm}
        accessibilityLabel="Volver">
        <Image source={require('@/assets/images/auth/back.png')} style={styles.backIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', alignItems: 'center', paddingBottom: spacing.xl },
  back: { position: 'absolute', left: spacing.lg },
  backIcon: { width: 30, height: 30, borderRadius: 15 },
});
