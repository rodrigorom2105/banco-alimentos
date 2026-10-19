import { ScrollView, View } from 'react-native';

import { GuestProfile, ProfileDetails } from '@/features/profile';
import { useAuth } from '@/providers';
import { Button, Screen } from '@/shared/components';
import { colors } from '@/shared/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  return (
    <Screen title="Mi cuenta" showBack={false}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 24 }}
      >
        {session ? (
          <>
            <ProfileDetails />
            <View>
              <Button title="Cerrar sesión" variant="outline" onPress={signOut} />
            </View>
          </>
        ) : (
          <GuestProfile />
        )}
      </ScrollView>
    </Screen>
  );
}
