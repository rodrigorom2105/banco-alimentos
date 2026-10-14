import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type { Stop } from '../../domain/assignment/route';
import type { NewPickup, Pickup, PickupStatus } from '../../domain/pickups/Pickup';
import type { PickupRepository, VolunteerPickup } from '../../domain/pickups/PickupRepository';
import { ConflictError } from '../../domain/shared/errors';

const COLUMNS =
  'id, request_id, volunteer_id, destination_campaign_id, status, assigned_at, accepted_at';

type PickupRow = {
  id: string;
  request_id: string;
  volunteer_id: string;
  destination_campaign_id: string;
  status: PickupStatus;
  assigned_at: string;
  accepted_at: string | null;
};

const toPickup = (row: PickupRow): Pickup => ({
  id: row.id,
  requestId: row.request_id,
  volunteerId: row.volunteer_id,
  destinationCampaignId: row.destination_campaign_id,
  status: row.status,
  assignedAt: row.assigned_at,
  acceptedAt: row.accepted_at,
});

// Primer y último día del mes que cubre 'YYYY-MM'. Se calcula con el día 1 del mes siguiente
// como límite abierto para no pelearse con los meses de 28, 30 o 31 días.
function monthRange(month: string) {
  const [year, index] = month.split('-').map(Number);
  const next =
    index === 12 ? `${year + 1}-01-01` : `${year}-${String(index + 1).padStart(2, '0')}-01`;
  return { from: `${month}-01`, before: next };
}

// Violación de restricción única en Postgres. La única que puede chocar aquí es
// `pickups_one_active_per_request`: dos asignaciones para la misma solicitud a la vez.
const isUniqueViolation = (error: PostgrestError) => error.code === '23505';

// Las paradas del día traen las coordenadas de los dos extremos del tramo: el domicilio del
// donador y el punto de acopio donde se entrega.
const STOP_COLUMNS = `
  id,
  volunteer_id,
  donation_requests!inner(latitude, longitude, preferred_date, preferred_time_from),
  campaigns!inner(latitude, longitude)
`;

type StopRow = {
  id: string;
  volunteer_id: string;
  donation_requests: {
    latitude: number;
    longitude: number;
    preferred_date: string;
    preferred_time_from: string;
  };
  campaigns: { latitude: number; longitude: number };
};

const PICKUP_LIST_COLUMNS = `
  id, status, assigned_at, accepted_at,
  donation_requests!inner(
    id, address, address_references, preferred_date,
    preferred_time_from, preferred_time_to, notes,
    municipalities(name),
    donation_items(description, quantity, unit)
  ),
  campaigns!inner(id, name, address)
`;

type PickupListRow = {
  id: string;
  status: PickupStatus;
  assigned_at: string;
  accepted_at: string | null;
  donation_requests: {
    id: string;
    address: string;
    address_references: string | null;
    preferred_date: string;
    preferred_time_from: string;
    preferred_time_to: string;
    notes: string | null;
    municipalities: { name: string } | null;
    donation_items: { description: string; quantity: number; unit: string }[];
  };
  campaigns: { id: string; name: string; address: string };
};

export class SupabasePickupRepository implements PickupRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.db
      .from('pickups')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle<PickupRow>();
    if (error) throw error;
    return data ? toPickup(data) : null;
  }

  async findActiveByRequest(requestId: string) {
    const { data, error } = await this.db
      .from('pickups')
      .select(COLUMNS)
      .eq('request_id', requestId)
      .neq('status', 'cancelled')
      .maybeSingle<PickupRow>();
    if (error) throw error;
    return data ? toPickup(data) : null;
  }

  async listDeclinedVolunteerIds(requestId: string) {
    const { data, error } = await this.db
      .from('pickups')
      .select('volunteer_id')
      .eq('request_id', requestId)
      .eq('status', 'cancelled')
      .returns<{ volunteer_id: string }[]>();
    if (error) throw error;
    return [...new Set(data.map((row) => row.volunteer_id))];
  }

  async listForVolunteer(volunteerId: string): Promise<VolunteerPickup[]> {
    const { data, error } = await this.db
      .from('pickups')
      .select(PICKUP_LIST_COLUMNS)
      .eq('volunteer_id', volunteerId)
      .neq('status', 'cancelled')
      .order('preferred_date', { referencedTable: 'donation_requests', ascending: true })
      .returns<PickupListRow[]>();
    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      status: row.status,
      assignedAt: row.assigned_at,
      acceptedAt: row.accepted_at,
      request: {
        id: row.donation_requests.id,
        address: row.donation_requests.address,
        addressReferences: row.donation_requests.address_references,
        municipalityName: row.donation_requests.municipalities?.name ?? '',
        preferredDate: row.donation_requests.preferred_date,
        preferredTimeFrom: row.donation_requests.preferred_time_from,
        preferredTimeTo: row.donation_requests.preferred_time_to,
        notes: row.donation_requests.notes,
        items: row.donation_requests.donation_items,
      },
      destination: row.campaigns,
    }));
  }

  async listStopsByVolunteer(volunteerIds: string[], date: string) {
    if (volunteerIds.length === 0) return {};

    // `!inner` hace obligatorio el join, que es lo que permite filtrar por una columna de la
    // solicitud (la fecha) desde una consulta sobre `pickups`.
    const { data, error } = await this.db
      .from('pickups')
      .select(STOP_COLUMNS)
      .in('volunteer_id', volunteerIds)
      .neq('status', 'cancelled')
      .eq('donation_requests.preferred_date', date)
      .returns<StopRow[]>();
    if (error) throw error;

    const byVolunteer: Record<string, Stop[]> = {};
    for (const row of data) {
      const stop: Stop = {
        id: row.id,
        coordinates: {
          latitude: row.donation_requests.latitude,
          longitude: row.donation_requests.longitude,
        },
        destination: { latitude: row.campaigns.latitude, longitude: row.campaigns.longitude },
        timeFrom: row.donation_requests.preferred_time_from,
      };
      (byVolunteer[row.volunteer_id] ??= []).push(stop);
    }
    return byVolunteer;
  }

  async countByVolunteerInMonth(volunteerIds: string[], month: string) {
    if (volunteerIds.length === 0) return {};
    const { from, before } = monthRange(month);

    const { data, error } = await this.db
      .from('pickups')
      .select('volunteer_id, donation_requests!inner(preferred_date)')
      .in('volunteer_id', volunteerIds)
      .neq('status', 'cancelled')
      .gte('donation_requests.preferred_date', from)
      .lt('donation_requests.preferred_date', before)
      .returns<{ volunteer_id: string }[]>();
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data) counts[row.volunteer_id] = (counts[row.volunteer_id] ?? 0) + 1;
    return counts;
  }

  /**
   * Crea la propuesta.
   *
   * No se manda `status` ni `accepted_at`: los pone la base (`pickups_before_insert` y
   * `pickups_set_offer_defaults`). Sí van `volunteer_id` y `destination_campaign_id` explícitos,
   * porque para la base el backend es un llamador privilegiado y no puede deducirlos de
   * `auth.uid()`, que desde aquí siempre es null.
   */
  async create(pickup: NewPickup) {
    const { data, error } = await this.db
      .from('pickups')
      .insert({
        request_id: pickup.requestId,
        volunteer_id: pickup.volunteerId,
        destination_campaign_id: pickup.destinationCampaignId,
      })
      .select('id')
      .single<{ id: string }>();

    if (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Esta donación acaba de asignarse a otro voluntario.');
      }
      throw error;
    }
    return data.id;
  }

  // La hora exacta la pone el trigger con `now()`; el valor que se manda solo sirve para que la
  // columna cambie y el trigger note la aceptación.
  async saveAcceptance(id: string) {
    const { error } = await this.db
      .from('pickups')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async saveCancellation(id: string, reason: string) {
    const { error } = await this.db
      .from('pickups')
      .update({ status: 'cancelled', cancellation_reason: reason })
      .eq('id', id);
    if (error) throw error;
  }
}
