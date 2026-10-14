import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Volunteer,
  VolunteerResubmission,
  VolunteerReview,
  VolunteerStatus,
  Weekday,
} from '../../domain/volunteers/Volunteer';
import type { VolunteerRepository } from '../../domain/volunteers/VolunteerRepository';

// El admin necesita ver con quién está tratando, así que se traen también los datos del
// usuario y sus municipios en la misma consulta (join de PostgREST).
const COLUMNS = `
  id, user_id, validation_status, rejection_reason, created_at,
  photo_path, proof_of_address_path,
  available_days, available_from, available_to,
  user:users!volunteers_user_id_fkey(first_name, last_name, phone),
  municipalities:volunteer_municipalities(municipality_id)
`;

type VolunteerRow = {
  id: string;
  user_id: string;
  validation_status: VolunteerStatus;
  rejection_reason: string | null;
  created_at: string;
  photo_path: string;
  proof_of_address_path: string;
  available_days: Weekday[];
  available_from: string;
  available_to: string;
  user: { first_name: string; last_name: string; phone: string | null } | null;
  municipalities: { municipality_id: number }[];
};

const toVolunteer = (row: VolunteerRow): Volunteer => ({
  id: row.id,
  userId: row.user_id,
  status: row.validation_status,
  firstName: row.user?.first_name ?? '',
  lastName: row.user?.last_name ?? '',
  phone: row.user?.phone ?? null,
  municipalityIds: row.municipalities.map((m) => m.municipality_id),
  availableDays: row.available_days,
  availableFrom: row.available_from,
  availableTo: row.available_to,
  photoPath: row.photo_path,
  proofOfAddressPath: row.proof_of_address_path,
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at,
});

export class SupabaseVolunteerRepository implements VolunteerRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.db
      .from('volunteers')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle<VolunteerRow>();
    if (error) throw error;
    return data ? toVolunteer(data) : null;
  }

  async findByUserId(userId: string) {
    const { data, error } = await this.db
      .from('volunteers')
      .select(COLUMNS)
      .eq('user_id', userId)
      .maybeSingle<VolunteerRow>();
    if (error) throw error;
    return data ? toVolunteer(data) : null;
  }

  async listByStatus(status: VolunteerStatus | null) {
    let query = this.db.from('volunteers').select(COLUMNS).order('created_at', { ascending: true });
    if (status) query = query.eq('validation_status', status);
    const { data, error } = await query.returns<VolunteerRow[]>();
    if (error) throw error;
    return data.map(toVolunteer);
  }

  async saveReview(id: string, review: VolunteerReview) {
    // `reviewed_by` va explícito: el backend usa la llave secreta, así que para la base
    // auth.uid() es null y el trigger no lo podría llenar solo.
    const { error } = await this.db
      .from('volunteers')
      .update({
        validation_status: review.status,
        reviewed_by: review.reviewedBy,
        reviewed_at: review.reviewedAt.toISOString(),
        rejection_reason: review.rejectionReason,
      })
      .eq('id', id);
    if (error) throw error;
  }

  async saveResubmission(id: string, data: VolunteerResubmission) {
    // Regresa a 'pending' y borra el rastro de la revisión anterior: el motivo del rechazo ya
    // no aplica a estos datos nuevos.
    const { error } = await this.db
      .from('volunteers')
      .update({
        validation_status: 'pending',
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        available_days: data.availableDays,
        available_from: data.availableFrom,
        available_to: data.availableTo,
      })
      .eq('id', id);
    if (error) throw error;

    // Los municipios se reemplazan por completo: es más simple y predecible que calcular
    // qué agregar y qué quitar.
    const { error: deleteError } = await this.db
      .from('volunteer_municipalities')
      .delete()
      .eq('volunteer_id', id);
    if (deleteError) throw deleteError;

    const { error: insertError } = await this.db
      .from('volunteer_municipalities')
      .insert(
        data.municipalityIds.map((municipality_id) => ({ volunteer_id: id, municipality_id })),
      );
    if (insertError) throw insertError;
  }
}
