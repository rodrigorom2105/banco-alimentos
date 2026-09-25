import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';

import { colors, radius } from '@/shared/theme';
import type { Coordinates } from '@/shared/utils';

const GUADALAJARA: Region = {
  latitude: 20.6597,
  longitude: -103.3496,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};
const ZOOMED_DELTA = 0.01;

export type AddressMapProps = {
  coordinate: Coordinates | null;
  onChange: (coordinate: Coordinates) => void;
};

export function AddressMap({ coordinate, onChange }: AddressMapProps) {
  const mapRef = useRef<MapView>(null);

  // Cuando el punto cambia por búsqueda o por "mi ubicación", el mapa lo sigue.
  useEffect(() => {
    if (coordinate) {
      mapRef.current?.animateToRegion({
        ...coordinate,
        latitudeDelta: ZOOMED_DELTA,
        longitudeDelta: ZOOMED_DELTA,
      });
    }
  }, [coordinate]);

  const handlePress = (event: MapPressEvent) => onChange(event.nativeEvent.coordinate);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={GUADALAJARA}
        onPress={handlePress}
        showsUserLocation
      >
        {coordinate && (
          <Marker
            coordinate={coordinate}
            draggable
            pinColor={colors.primary}
            onDragEnd={(event) => onChange(event.nativeEvent.coordinate)}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 200, overflow: 'hidden', borderRadius: radius.md },
});
