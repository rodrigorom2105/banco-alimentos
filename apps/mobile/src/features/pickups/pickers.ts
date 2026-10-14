import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

/**
 * Foto de la entrega en el centro de acopio.
 *
 * Sin recorte en cuadro, a diferencia de la foto del voluntario: aquí lo que importa es que se
 * vea el donativo entregado, y recortarlo podría cortar justo lo que prueba. Se comprime al
 * tomarla porque va a un bucket con límite de 5 MB y lo que sale de una cámara moderna lo pasa.
 *
 * Devuelve null si cancela o niega el permiso de cámara.
 */
export async function takeEvidencePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
  return result.canceled ? null : result.assets[0].uri;
}

/**
 * Dónde está el voluntario, para que la ruta arranque ahí.
 *
 * Devuelve null si niega el permiso o si el GPS falla, y eso NO es un error: sin ubicación la
 * ruta se ordena desde la primera parada por horario y Google Maps arranca donde esté el
 * celular. Pedir permiso es una cortesía, no un requisito.
 */
export async function currentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: coords.latitude, longitude: coords.longitude };
  } catch {
    return null;
  }
}
