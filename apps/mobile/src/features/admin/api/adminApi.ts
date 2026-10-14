import { apiRequest } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';

import type {
  NewCenter,
  SupportRequestForReview,
  SupportStatus,
  VolunteerForReview,
  VolunteerStatus,
} from '../types';

// Cuánto vive la URL firmada de un documento: lo suficiente para verlo, no para compartirlo.
const SIGNED_URL_SECONDS = 60;

const query = (status: string | null) => (status ? `?status=${status}` : '');

// Todo pasa por el backend: RLS no deja que un admin cambie `validation_status` ni lea varios
// voluntarios desde la app, y ahí viven las reglas (motivo obligatorio, municipios, etc.).
export const adminApi = {
  // Solo se usa para contar pendientes: la lista completa de campañas se sigue leyendo de
  // Supabase, porque ahí RLS ya deja que un admin vea todas.
  countPendingCampaigns() {
    return apiRequest<{ id: string }[]>('GET', '/admin/campaigns?status=pending').then(
      (list) => list.length,
    );
  },

  listVolunteers(status: VolunteerStatus | null) {
    return apiRequest<VolunteerForReview[]>('GET', `/admin/volunteers${query(status)}`);
  },

  approveVolunteer(id: string) {
    return apiRequest<{ status: VolunteerStatus }>('POST', `/admin/volunteers/${id}/approve`);
  },

  rejectVolunteer(id: string, reason: string) {
    return apiRequest<{ status: VolunteerStatus }>('POST', `/admin/volunteers/${id}/reject`, {
      reason,
    });
  },

  // Levanta una suspensión y lo devuelve a `approved`.
  reactivateVolunteer(id: string) {
    return apiRequest<{ status: VolunteerStatus }>('POST', `/admin/volunteers/${id}/reactivate`);
  },

  suspendVolunteer(id: string, reason: string) {
    return apiRequest<{ status: VolunteerStatus }>('POST', `/admin/volunteers/${id}/suspend`, {
      reason,
    });
  },

  listSupportRequests(status: SupportStatus | null) {
    return apiRequest<SupportRequestForReview[]>('GET', `/admin/support-requests${query(status)}`);
  },

  respondSupportRequest(id: string, approved: boolean, message: string) {
    return apiRequest<{ status: SupportStatus }>('POST', `/admin/support-requests/${id}/respond`, {
      approved,
      message,
    });
  },

  deliverSupportRequest(id: string) {
    return apiRequest<{ status: SupportStatus }>('POST', `/admin/support-requests/${id}/deliver`);
  },

  createCenter(center: NewCenter) {
    return apiRequest<{ id: string }>('POST', '/admin/campaigns', center);
  },

  /**
   * URL temporal para ver un documento del voluntario.
   *
   * No pasa por el backend: el bucket es privado y su política deja leer todo a quien sea
   * admin (07_storage_buckets.sql), así que la propia sesión del admin alcanza. La URL
   * caduca en un minuto, así que no sirve para compartir el documento por fuera.
   */
  async documentUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('volunteer-documents')
      .createSignedUrl(path, SIGNED_URL_SECONDS);
    if (error) throw error;
    return data.signedUrl;
  },
};
