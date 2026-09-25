import { StyleSheet, View } from 'react-native';

import { CampaignList } from '@/features/campaigns';
import { colors } from '@/shared/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <CampaignList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
