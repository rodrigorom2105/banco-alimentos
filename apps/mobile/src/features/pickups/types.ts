import type { Enums } from '@/shared/lib/database.types';

export type PickupStatus = Enums<'pickup_status'>;
export type ItemUnit = Enums<'item_unit'>;

/**
 * Una recolección del voluntario, como la devuelve GET /volunteer/pickups.
 *
 * Los nombres van en camelCase porque vienen del backend, no de Supabase. `acceptedAt` en null
 * es lo que distingue una propuesta por confirmar de una recolección ya aceptada.
 */
export type Coordinates = { latitude: number; longitude: number };

export type PickupItem = {
  id: string;
  description: string;
  quantity: number;
  unit: ItemUnit;
  // Lo que el voluntario registró al recoger; null hasta entonces.
  collectedQuantity: number | null;
};

export type MyPickup = {
  id: string;
  status: PickupStatus;
  assignedAt: string;
  acceptedAt: string | null;
  request: {
    id: string;
    donorName: string;
    // El esquema solo deja al voluntario ver el teléfono mientras la recolección esté en curso.
    donorPhone: string | null;
    address: string;
    addressReferences: string | null;
    municipalityName: string;
    coordinates: Coordinates;
    preferredDate: string;
    preferredTimeFrom: string;
    preferredTimeTo: string;
    notes: string | null;
    items: PickupItem[];
  };
  destination: { id: string; name: string; address: string; coordinates: Coordinates };
};

// Lo que devuelve GET /volunteer/summary: los contadores del panel.
export type PickupSummary = { active: number; deliveredThisMonth: number };

// GET /volunteer/route. `mapsUrl` en null = no hay nada que recorrer ese día.
export type DayRoute = { stops: MyPickup[]; mapsUrl: string | null };

// Cuánto se recolectó de cada producto, al marcar la recolección como recogida.
export type CollectedItem = { itemId: string; collectedQuantity: number };

// Siguiente paso del flujo, o null si ya no hay ninguno.
export const nextStep = (pickup: MyPickup): 'start' | 'collect' | 'deliver' | null => {
  if (pickup.status === 'assigned') return pickup.acceptedAt ? 'start' : null;
  if (pickup.status === 'on_the_way') return 'collect';
  if (pickup.status === 'collected') return 'deliver';
  return null;
};

// Sin confirmar: es lo único que el voluntario puede aceptar o rechazar.
export const isOffer = (pickup: MyPickup) =>
  pickup.status === 'assigned' && pickup.acceptedAt === null;
