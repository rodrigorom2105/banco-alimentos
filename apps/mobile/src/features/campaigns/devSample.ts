import { DEV_ALL_ROLES } from '@/shared/lib/devFlags';

import type { ManagedCampaign } from './types';

// TEMPORAL — campaña aprobada de ejemplo para probar pantallas sin datos reales en Supabase.
// Solo existe en desarrollo (misma bandera que el modo prueba) y no está en la base, así que
// cualquier cambio sobre ella se bloquea con un mensaje claro.
export const DEV_SAMPLE_ENABLED = DEV_ALL_ROLES;

export const DEV_SAMPLE_ID = '00000000-0000-4000-8000-000000000001';

export function devSampleCampaign(organizerId: string | null): ManagedCampaign {
  return {
    id: DEV_SAMPLE_ID,
    type: 'community',
    status: 'approved',
    name: '(Ejemplo) Campaña Col. Chapalita',
    description:
      'Campaña de ejemplo para probar la app. Recolectamos granos, enlatados y leche no perecedera para BAMX.',
    address: 'Av. Guadalupe 1234, Chapalita',
    municipality: { id: 1, name: 'Guadalajara' },
    latitude: 20.668,
    longitude: -103.399,
    start_date: '2026-09-20',
    end_date: '2026-10-31',
    schedule: 'Lun a Sáb 9:00-18:00',
    contact_phone: '33 1234 5678',
    cover_image_url: null,
    organizer_id: organizerId,
    rejection_reason: null,
  };
}

export const isDevSample = (id: string) => DEV_SAMPLE_ENABLED && id === DEV_SAMPLE_ID;

export function assertNotDevSample(id: string) {
  if (isDevSample(id)) {
    throw new Error('Es una campaña de ejemplo: no existe en Supabase y no se puede modificar.');
  }
}
