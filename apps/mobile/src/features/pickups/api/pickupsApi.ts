import { File } from 'expo-file-system';

import { apiRequest } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';

import type { CollectedItem, DayRoute, MyPickup, PickupSummary } from '../types';

const BUCKET = 'pickup-evidence';

/**
 * Todo pasa por el backend.
 *
 * La lista podría leerse de Supabase —RLS deja al voluntario ver sus propias recolecciones—,
 * pero necesita datos de otras tablas (domicilio y teléfono del donador, productos, punto de
 * acopio) y armar ese join respetando la política de cada una desde la app sería frágil. Los
 * pasos del flujo, además, tienen reglas de negocio y disparan avisos y reasignaciones.
 *
 * La foto es la excepción: se sube directo a Storage, porque mandar una imagen por el backend
 * solo agregaría un salto y un límite de tamaño más.
 */
export const pickupsApi = {
  listMine() {
    return apiRequest<MyPickup[]>('GET', '/volunteer/pickups');
  },

  summary() {
    return apiRequest<PickupSummary>('GET', '/volunteer/summary');
  },

  // `from` es opcional: sin ubicación, Google Maps arranca donde esté el celular.
  route(date: string, from: { latitude: number; longitude: number } | null) {
    const location = from ? `&lat=${from.latitude}&lng=${from.longitude}` : '';
    return apiRequest<DayRoute>('GET', `/volunteer/route?date=${date}${location}`);
  },

  accept(id: string) {
    return apiRequest<{ accepted: true }>('POST', `/pickups/${id}/accept`);
  },

  // `reassigned` dice si la donación ya encontró a otro voluntario, para poder explicarle al
  // que rechazó que el donativo no se quedó sin nadie.
  decline(id: string, reason: string) {
    return apiRequest<{ declined: true; reassigned: boolean }>('POST', `/pickups/${id}/decline`, {
      reason,
    });
  },

  start(id: string) {
    return apiRequest<{ status: 'on_the_way' }>('POST', `/pickups/${id}/start`);
  },

  collect(id: string, items: CollectedItem[]) {
    return apiRequest<{ status: 'collected' }>('POST', `/pickups/${id}/collect`, { items });
  },

  /**
   * Sube la foto de la entrega y marca la recolección como entregada.
   *
   * La ruta es `{user_id}/{pickup_id}.jpg`, que es lo que exigen las políticas del bucket. Va
   * sin `upsert`: la evidencia es un comprobante y el bucket no tiene política de update ni de
   * delete, así que no se puede reemplazar ni por error.
   */
  async deliver(id: string, userId: string, photoUri: string) {
    const path = `${userId}/${id}.jpg`;
    const bytes = await new File(photoUri).bytes();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg' });
    if (error) throw error;

    return apiRequest<{ status: 'delivered' }>('POST', `/pickups/${id}/deliver`, {
      evidencePhotoPath: path,
    });
  },

  // Desistir de una recolección ya confirmada. Distinto de `decline`: aquí el donador ya
  // contaba con que alguien iba a pasar, así que recibe un aviso.
  cancel(id: string, reason: string) {
    return apiRequest<{ cancelled: true; reassigned: boolean }>('POST', `/pickups/${id}/cancel`, {
      reason,
    });
  },
};
