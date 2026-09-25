import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useMunicipalities } from '@/shared/hooks';
import type { Municipality } from '@/shared/lib/catalogs';
import {
  geocodeAddress,
  getCurrentCoordinates,
  isGeocodingAvailable,
  reverseGeocode,
} from '@/shared/lib/geocoding';
import { colors, radius, spacing } from '@/shared/theme';
import { normalizeText, type Coordinates } from '@/shared/utils';

import { Select } from '../Select';
import { AddressMap } from './AddressMap';

export type AddressValue = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  municipalityId: number | null;
};

export const EMPTY_ADDRESS: AddressValue = {
  address: '',
  latitude: null,
  longitude: null,
  municipalityId: null,
};

// El geocodificador devuelve "Tlaquepaque" y el catálogo "San Pedro Tlaquepaque": se compara
// en ambos sentidos y sin acentos.
function matchMunicipality(placeNames: string[], municipalities: Municipality[]) {
  const candidates = placeNames.map(normalizeText).filter((name) => name.length > 3);
  return municipalities.find((m) => {
    const name = normalizeText(m.name);
    return candidates.some((c) => c.includes(name) || name.includes(c));
  });
}

type Props = {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  error?: string | null;
};

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function IconButton(props: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={props.label}
    >
      <MaterialCommunityIcons name={props.icon} size={22} color={colors.primary} />
    </Pressable>
  );
}

export function AddressPicker({ value, onChange, error }: Props) {
  const { items: municipalities } = useMunicipalities();
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const coordinate: Coordinates | null =
    value.latitude !== null && value.longitude !== null
      ? { latitude: value.latitude, longitude: value.longitude }
      : null;

  const run = async (task: () => Promise<void>) => {
    setIsWorking(true);
    setMessage(null);
    try {
      await task();
    } catch {
      setMessage('No se pudo obtener la ubicación. Intenta de nuevo.');
    } finally {
      setIsWorking(false);
    }
  };

  // Al mover el punto se completa la dirección y el municipio, si el geocodificador los conoce.
  const placeAt = async (coords: Coordinates, keepAddress = false) => {
    const place = await reverseGeocode(coords);
    const municipality = place && matchMunicipality(place.placeNames, municipalities);
    onChange({
      ...value,
      ...coords,
      address: keepAddress || !place?.address ? value.address : place.address,
      municipalityId: municipality?.id ?? value.municipalityId,
    });
  };

  const search = () =>
    run(async () => {
      if (!value.address.trim()) return;
      const coords = await geocodeAddress(value.address);
      if (!coords) {
        setMessage('No encontramos esa dirección. Prueba con calle y colonia, o marca el mapa.');
        return;
      }
      await placeAt(coords, true);
    });

  const useMyLocation = () =>
    run(async () => {
      const coords = await getCurrentCoordinates();
      if (!coords) {
        setMessage('Activa el permiso de ubicación para usar esta opción.');
        return;
      }
      await placeAt(coords);
    });

  const hint = isGeocodingAvailable
    ? 'Escribe la dirección y búscala, o toca el mapa para marcar el punto exacto.'
    : 'En web usa "mi ubicación" para fijar el punto exacto; la búsqueda por texto está en la app.';

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          value={value.address}
          onChangeText={(address) => onChange({ ...value, address })}
          onSubmitEditing={search}
          placeholder="Buscar zona o colonia"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          style={styles.input}
        />
        {isWorking ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            {isGeocodingAvailable && (
              <IconButton icon="magnify" label="Buscar dirección" onPress={search} />
            )}
            <IconButton icon="crosshairs-gps" label="Usar mi ubicación" onPress={useMyLocation} />
          </>
        )}
      </View>

      <AddressMap coordinate={coordinate} onChange={(coords) => run(() => placeAt(coords))} />

      <Select
        value={value.municipalityId}
        options={municipalities.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(municipalityId) => onChange({ ...value, municipalityId })}
        placeholder="Municipio"
      />

      {coordinate && (
        <Text style={styles.located}>
          <MaterialCommunityIcons name="check-circle" size={14} color={colors.primary} /> Punto
          marcado en el mapa
        </Text>
      )}
      <Text style={[styles.hint, !!(error || message) && styles.error]}>
        {error ?? message ?? hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
  located: { fontSize: 12, color: colors.primary },
  hint: { fontSize: 12, color: colors.textSecondary },
  error: { color: colors.danger },
});
