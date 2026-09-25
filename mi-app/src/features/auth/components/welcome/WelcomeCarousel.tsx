import { useState } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';

import { Paginator } from './Paginator';
import { slides } from './slides';
import { WelcomeItem } from './WelcomeItem';

export function WelcomeCarousel() {
  const [scrollX] = useState(() => new Animated.Value(0));

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        <FlatList
          data={slides}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <WelcomeItem item={item} isLastItem={index === slides.length - 1} />}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={32}
        />
      </View>
      <Paginator count={slides.length} scrollX={scrollX} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 3, alignSelf: 'stretch' },
});
