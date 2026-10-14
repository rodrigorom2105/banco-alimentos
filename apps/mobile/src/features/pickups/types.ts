import type { Enums } from '@/shared/lib/database.types';

export type PickupStatus = Enums<'pickup_status'>;
export type ItemUnit = Enums<'item_unit'>;

/**
 * Una recolección del voluntario, como la devuelve GET /volunteer/pickups.
 *
 * Los nombres van en camelCase porque vienen del backend, no de Supabase. `acceptedAt` en null
 * es lo que distingue una propuesta por confirmar de una recolección ya aceptada.
 */
export type MyPickup = {
  id: string;
  status: PickupStatus;
  assignedAt: string;
  acceptedAt: string | null;
  request: {
    id: string;
    address: string;
    addressReferences: string | null;
    municipalityName: string;
    preferredDate: string;
    preferredTimeFrom: string;
    preferredTimeTo: string;
    notes: string | null;
    items: { description: string; quantity: number; unit: ItemUnit }[];
  };
  destination: { id: string; name: string; address: string };
};

// Sin confirmar: es lo único que el voluntario puede aceptar o rechazar.
export const isOffer = (pickup: MyPickup) =>
  pickup.status === 'assigned' && pickup.acceptedAt === null;
