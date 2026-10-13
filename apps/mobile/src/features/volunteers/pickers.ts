import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import type { PickedFile } from './types';
import { ALLOWED_PROOF_TYPES } from './validation';

// La foto se comprime al elegirla (quality 0.6) y se recorta en cuadro: así pesa cientos de
// kilobytes en lugar de varios megas, que es lo que sale de la cámara de un celular moderno.
const PHOTO_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6,
  allowsEditing: true,
  aspect: [1, 1],
};

const toPickedFile = (asset: ImagePicker.ImagePickerAsset): PickedFile => ({
  uri: asset.uri,
  name: asset.fileName ?? 'photo.jpg',
  mimeType: asset.mimeType ?? 'image/jpeg',
  size: asset.fileSize ?? null,
});

/** Abre la cámara. Devuelve null si el usuario cancela o niega el permiso. */
export async function takePhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync(PHOTO_OPTIONS);
  return result.canceled ? null : toPickedFile(result.assets[0]);
}

/** Abre la galería. Devuelve null si el usuario cancela o niega el permiso. */
export async function choosePhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync(PHOTO_OPTIONS);
  return result.canceled ? null : toPickedFile(result.assets[0]);
}

/** Comprobante de domicilio: PDF o imagen. */
export async function chooseProofOfAddress(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ALLOWED_PROOF_TYPES,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? null,
  };
}
