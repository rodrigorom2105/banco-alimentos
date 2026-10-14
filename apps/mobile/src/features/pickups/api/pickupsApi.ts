import { apiRequest } from '@/shared/lib/api';

import type { MyPickup } from '../types';

/**
 * Todo pasa por el backend.
 *
 * La lista podría leerse de Supabase —RLS deja al voluntario ver sus propias recolecciones—,
 * pero necesita datos de otras tablas (domicilio del donador, productos, punto de acopio) y
 * armar ese join respetando la política de cada una desde la app sería frágil. Aceptar y
 * rechazar, además, tienen reglas de negocio y disparan la reasignación.
 */
export const pickupsApi = {
  listMine() {
    return apiRequest<MyPickup[]>('GET', '/volunteer/pickups');
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
};
