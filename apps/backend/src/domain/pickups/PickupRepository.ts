import type { Stop } from '../assignment/route';
import type { NewPickup, Pickup, PickupStatus } from './Pickup';

// Una recolección como la ve el voluntario en su panel.
export type VolunteerPickup = {
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
    items: { description: string; quantity: number; unit: string }[];
  };
  destination: { id: string; name: string; address: string };
};

// Puerto: el dominio define qué necesita; la infraestructura decide cómo.
export interface PickupRepository {
  findById(id: string): Promise<Pickup | null>;
  // La propuesta o recolección viva de una solicitud (las canceladas no cuentan). Es única: lo
  // garantiza el índice `pickups_one_active_per_request`.
  findActiveByRequest(requestId: string): Promise<Pickup | null>;
  // Voluntarios que ya rechazaron o cancelaron esta solicitud; no se les vuelve a ofrecer.
  listDeclinedVolunteerIds(requestId: string): Promise<string[]>;
  // Recolecciones activas del voluntario, de la más próxima a la más lejana.
  listForVolunteer(volunteerId: string): Promise<VolunteerPickup[]>;

  /**
   * Carga de varios voluntarios a la vez.
   *
   * Van en lote y no uno por uno porque la asignación los evalúa a todos: con una consulta por
   * voluntario, agregar personas al programa haría más lenta cada donación.
   */
  listStopsByVolunteer(volunteerIds: string[], date: string): Promise<Record<string, Stop[]>>;
  // `month` en formato 'YYYY-MM'.
  countByVolunteerInMonth(volunteerIds: string[], month: string): Promise<Record<string, number>>;

  // Devuelve el id de la recolección creada.
  create(pickup: NewPickup): Promise<string>;
  saveAcceptance(id: string): Promise<void>;
  saveCancellation(id: string, reason: string): Promise<void>;
}
