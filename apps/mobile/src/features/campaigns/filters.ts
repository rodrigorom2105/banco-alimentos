import type { CampaignStatus, ManagedCampaign } from './types';

// Orden en que se muestran los chips: primero lo que espera acción, al final el historial.
const STATUS_ORDER: CampaignStatus[] = ['pending', 'approved', 'active', 'finished', 'rejected'];

// `null` = chip "Todas".
export type StatusFilter = CampaignStatus | null;

/**
 * Qué chips de filtro se muestran.
 *
 * - Admin: siempre los cinco estados, porque necesita poder entrar a "Pendientes" aunque esté
 *   vacío (es su bandeja de revisión).
 * - Organizador: solo los estados en los que de verdad tiene campañas, y nada si todas están
 *   en el mismo estado (un filtro con una sola opción no filtra nada).
 */
export function statusFiltersFor(campaigns: ManagedCampaign[], isAdmin: boolean): StatusFilter[] {
  if (isAdmin) return [null, ...STATUS_ORDER];

  const present = STATUS_ORDER.filter((status) => campaigns.some((c) => c.status === status));
  return present.length > 1 ? [null, ...present] : [];
}
