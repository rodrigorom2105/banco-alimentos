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
  items: DonationItem[];
};
