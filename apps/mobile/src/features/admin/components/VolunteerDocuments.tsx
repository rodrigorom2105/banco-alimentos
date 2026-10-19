import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/errors';
import { colors, fonts, radius, spacing } from '@/shared/theme';

import { adminApi } from '../api/adminApi';

type Props = { photoPath: string; proofOfAddressPath: string };

/**
 * Los dos documentos del voluntario, para validar su identidad y su domicilio.
 *
 * El bucket es privado: no se puede poner la ruta en un `<Image>` y esperar que cargue. Hay
 * que pedirle a Supabase una URL firmada, que caduca en un minuto. Por eso se pide al entrar
 * a la pantalla y no antes.
 */
export function VolunteerDocuments({ photoPath, proofOfAddressPath }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi
      .documentUrl(photoPath)
      .then((url) => active && setPhotoUrl(url))
      .catch((e) => active && setError(getErrorMessage(e, 'No se pudo cargar la fotografía.')));
    return () => {
      active = false;
    };
  }, [photoPath]);

  // El comprobante puede ser un PDF, que no se puede dibujar en un <Image>; se abre en el
  // navegador del sistema con la URL firmada.
  const openProof = async () => {
    setIsOpening(true);
    setError(null);
    try {
      await WebBrowser.openBrowserAsync(await adminApi.documentUrl(proofOfAddressPath));
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo abrir el comprobante.'));
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.photoBox}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>

      <Pressable
        onPress={openProof}
        disabled={isOpening}
        accessibilityRole="button"
        style={({ pressed }) => [styles.proof, pressed && styles.pressed]}
      >
        <Text style={styles.proofText}>
          {isOpening ? 'Abriendo…' : 'Ver comprobante de domicilio'}
        </Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  photoBox: {
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  proof: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  proofText: { color: colors.primary, fontFamily: fonts.heading },
  error: { fontSize: 12, color: colors.danger },
});
