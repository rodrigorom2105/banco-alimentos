import { File } from 'expo-file-system';

import { apiRequest } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';

import type { MyVolunteerApplication, PickedFile, Weekday } from '../types';
import { extensionFor } from '../validation';

const BUCKET = 'volunteer-documents';

// Las rutas son fijas por usuario ({user_id}/photo.jpg), no llevan fecha ni id aleatorio.
// Eso hace que reenviar la solicitud sobrescriba los archivos en lugar de acumular basura, y
// que un reintento después de un error quede limpio. Las políticas del bucket exigen que la
// primera carpeta sea el id del usuario.
const photoPath = (userId: string) => `${userId}/photo.jpg`;
const proofPath = (userId: string, file: PickedFile) =>
  `${userId}/proof-of-address.${extensionFor(file)}`;

// Supabase necesita los bytes del archivo. En el celular el picker solo da una ruta local
// (file://...), así que hay que leerla; `File.bytes()` de expo-file-system devuelve el
// Uint8Array que el SDK de Storage acepta directamente.
async function upload(path: string, file: PickedFile) {
  const bytes = await new File(file.uri).bytes();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.mimeType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export const volunteersApi = {
  // RLS solo deja ver la solicitud propia, así que basta filtrar por el id del usuario. Se
  // traen también disponibilidad y municipios para poder precargar el formulario si la
  // persona vuelve a enviarla.
  async getMine(userId: string): Promise<MyVolunteerApplication | null> {
    const { data, error } = await supabase
      .from('volunteers')
      .select(
        `id, validation_status, rejection_reason, created_at,
         available_days, available_from, available_to,
         municipalities:volunteer_municipalities(municipality_id)`,
      )
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { municipalities, ...application } = data;
    return {
      ...application,
      municipalityIds: municipalities.map((m) => m.municipality_id),
    };
  },

  /**
   * Envía la solicitud completa.
   *
   * 1. Sube los dos archivos.
   * 2. Llama a `apply_as_volunteer`, que inserta la solicitud y sus municipios en UNA
   *    transacción (ver 07b_apply_as_volunteer.sql). Si algo falla ahí, la base deshace
   *    todo: nunca queda una solicitud sin municipios, que sería imposible de aprobar.
   *
   * Si los archivos se subieron y la función falla, quedan dos archivos huérfanos en el
   * bucket. No pasa nada: al reintentar se sobrescriben, porque la ruta es la misma.
   */
  async apply(
    userId: string,
    application: {
      photo: PickedFile;
      proofOfAddress: PickedFile;
      days: Weekday[];
      from: string;
      to: string;
      municipalityIds: number[];
    },
  ) {
    const photo = await upload(photoPath(userId), application.photo);
    const proof = await upload(
      proofPath(userId, application.proofOfAddress),
      application.proofOfAddress,
    );

    const { data, error } = await supabase.rpc('apply_as_volunteer', {
      p_photo_path: photo,
      p_proof_of_address_path: proof,
      p_available_days: application.days,
      p_available_from: `${application.from}:00`,
      p_available_to: `${application.to}:00`,
      p_municipality_ids: application.municipalityIds,
    });
    if (error) throw error;
    return data as string;
  },

  /**
   * Vuelve a enviar una solicitud rechazada.
   *
   * Pasa por el backend porque la base prohíbe que el usuario cambie su propio
   * `validation_status`. Los archivos son opcionales: si no se eligieron nuevos, se conservan
   * los que ya están en el bucket (la ruta es fija, así que el backend ni se enteraría).
   */
  async resubmit(
    userId: string,
    application: {
      photo: PickedFile | null;
      proofOfAddress: PickedFile | null;
      days: Weekday[];
      from: string;
      to: string;
      municipalityIds: number[];
    },
  ) {
    if (application.photo) await upload(photoPath(userId), application.photo);
    if (application.proofOfAddress) {
      await upload(proofPath(userId, application.proofOfAddress), application.proofOfAddress);
    }

    return apiRequest<{ status: 'pending' }>('POST', '/volunteers/me/resubmit', {
      availableDays: application.days,
      availableFrom: `${application.from}:00`,
      availableTo: `${application.to}:00`,
      municipalityIds: application.municipalityIds,
    });
  },
};
