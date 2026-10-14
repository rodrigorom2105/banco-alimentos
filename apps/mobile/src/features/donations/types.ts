import type { Enums } from '@/shared/lib/database.types';

import type { ItemUnit } from './labels';

export type DonationRequestStatus = Enums<'donation_request_status'>;

export type DonationItem = {
  id: string;
  description: string;
  quantity: number;
  unit: ItemUnit;
  // Lo que el voluntario registró al recoger; null hasta entonces.
  collected_quantity: number | null;
  category: { name: string } | null;
};

// Lo que responde POST /donation-requests/:id/assign.
export type AssignmentResult =
  | { assigned: true; pickupId: string; volunteerName: string }
  | { assigned: false; reason: 'no_candidate' };

// La recolección de la solicitud. `accepted_at` en null = se le propuso a un voluntario pero
// todavía no confirma, así que para el donador sigue sin haber nadie comprometido.
export type DonationPickup = {
  status: Enums<'pickup_status'>;
  accepted_at: string | null;
};

// Una solicitud propia, como la ve el donador en "Mis donaciones".
export type MyDonationRequest = {
  id: string;
  address: string;
  address_references: string | null;
  preferred_date: string;
  preferred_time_from: string;
  preferred_time_to: string;
  notes: string | null;
  status: DonationRequestStatus;
  cancellation_reason: string | null;
  created_at: string;
  municipality: { name: string } | null;
  // La campaña que eligió; null = la plataforma asigna la más cercana del municipio.
  preferred_campaign: { name: string } | null;
  // Todas las recolecciones de la solicitud, incluidas las canceladas (una solicitud puede
  // haber pasado por varios voluntarios). `activePickup` se queda con la que cuenta.
  pickups: DonationPickup[];
  items: DonationItem[];
};

// La recolección viva: el índice `pickups_one_active_per_request` garantiza que no haya dos.
export const activePickup = (donation: MyDonationRequest): DonationPickup | null =>
  donation.pickups.find((p) => p.status !== 'cancelled') ?? null;

/**
 * Quién va a pasar por el donativo, según `get_request_volunteer()`.
 *
 * Solo el nombre: la foto vive en un bucket privado al que el donador no tiene acceso, así que
 * la ruta que devuelve la función no se puede abrir desde aquí.
 */
export type RequestVolunteer = {
  firstName: string;
  lastName: string;
  acceptedAt: string | null;
};
