import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  DonationRequest,
  DonationRequestStatus,
  OpenDonationRequest,
} from '../../domain/donations/DonationRequest';
import type { DonationRequestRepository } from '../../domain/donations/DonationRequestRepository';
import type { PickupStatus } from '../../domain/pickups/Pickup';

const COLUMNS = `
  id, donor_id, municipality_id, latitude, longitude,
  preferred_date, preferred_time_from, preferred_time_to,
  preferred_campaign_id, status,
  municipalities(name)
`;

type RequestRow = {
  id: string;
  donor_id: string;
  municipality_id: number;
  latitude: number;
  longitude: number;
  preferred_date: string;
  preferred_time_from: string;
  preferred_time_to: string;
  preferred_campaign_id: string | null;
  status: DonationRequestStatus;
  municipalities: { name: string } | null;
};

const toRequest = (row: RequestRow): DonationRequest => ({
  id: row.id,
  donorId: row.donor_id,
  municipalityId: row.municipality_id,
  coordinates: { latitude: row.latitude, longitude: row.longitude },
  preferredDate: row.preferred_date,
  preferredTimeFrom: row.preferred_time_from,
  preferredTimeTo: row.preferred_time_to,
  preferredCampaignId: row.preferred_campaign_id,
  status: row.status,
  municipalityName: row.municipalities?.name ?? '',
});

// La lista del panel necesita además quién la pidió, dónde y qué propuesta tiene viva.
const OPEN_COLUMNS = `
  ${COLUMNS}, address, created_at,
  users!donation_requests_donor_id_fkey(first_name, last_name),
  donation_items(id),
  pickups(id, volunteer_id, status, assigned_at, accepted_at,
          volunteers(users!volunteers_user_id_fkey(first_name, last_name)))
`;

type OpenRequestRow = RequestRow & {
  address: string;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
  donation_items: { id: string }[];
  pickups: {
    id: string;
    volunteer_id: string;
    status: PickupStatus;
    assigned_at: string;
    accepted_at: string | null;
    volunteers: { users: { first_name: string; last_name: string } | null } | null;
  }[];
};

const name = (user: { first_name: string; last_name: string } | null | undefined) =>
  user ? `${user.first_name} ${user.last_name}`.trim() : '';

export class SupabaseDonationRequestRepository implements DonationRequestRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.db
      .from('donation_requests')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle<RequestRow>();
    if (error) throw error;
    return data ? toRequest(data) : null;
  }

  /**
   * Solicitudes que todavía podrían recibir un voluntario.
   *
   * Se traen las `pending` y las `assigned` porque una `assigned` puede tener una propuesta que
   * nadie respondió. Cuál de esas cuenta como vencida lo decide el dominio: el plazo es una
   * regla de negocio y no tiene por qué estar escrito en esta consulta.
   *
   * De `pickups` solo interesa la propuesta viva, así que las canceladas se descartan al mapear
   * (el índice `pickups_one_active_per_request` garantiza que no haya más de una sin cancelar).
   */
  async listOpenForAssignment(): Promise<OpenDonationRequest[]> {
    const { data, error } = await this.db
      .from('donation_requests')
      .select(OPEN_COLUMNS)
      .in('status', ['pending', 'assigned'])
      .order('preferred_date', { ascending: true })
      .returns<OpenRequestRow[]>();
    if (error) throw error;

    return data.map((row) => {
      const active = row.pickups.find((p) => p.status !== 'cancelled');
      return {
        ...toRequest(row),
        donorName: name(row.users),
        address: row.address,
        itemsCount: row.donation_items.length,
        createdAt: row.created_at,
        offer: active
          ? {
              pickupId: active.id,
              volunteerId: active.volunteer_id,
              volunteerName: name(active.volunteers?.users),
              status: active.status,
              assignedAt: active.assigned_at,
              acceptedAt: active.accepted_at,
            }
          : null,
      };
    });
  }
}
