import type { Coordinates } from '../assignment/geo';
import type { Stop } from '../assignment/route';
import type { CollectedItem, NewPickup, Pickup, PickupStatus } from './Pickup';

/**
 * Una recolección como la ve el voluntario en su panel.
 *
 * Trae el teléfono del donador porque lo necesita para avisar que va en camino; el esquema solo
 * se lo permite mientras la recolección esté en curso, y esta consulta solo devuelve esas.
 */
export type VolunteerPickup = {
  id: string;
  status: PickupStatus;
  assignedAt: string;
  acceptedAt: string | null;
  request: {
    id: string;
    donorName: string;
    donorPhone: string | null;
    address: string;
    addressReferences: string | null;
    municipalityName: string;
    coordinates: Coordinates;
    preferredDate: string;
    preferredTimeFrom: string;
    preferredTimeTo: string;
    notes: string | null;
    items: {
      id: string;
      description: string;
      quantity: number;
      unit: string;
      collectedQuantity: number | null;
    }[];
  };
  destination: { id: string; name: string; address: string; coordinates: Coordinates };
};

// Puerto: el dominio define qué necesita; la infraestructura decide cómo.
export interface PickupRepository {
  findById(id: string): Promise<Pickup | null>;
  // La propuesta o recolección viva de una solicitud (las canceladas no cuentan). Es única: lo
  // garantiza el índice `pickups_one_active_per_request`.
  findActiveByRequest(requestId: string): Promise<Pickup | null>;
  // Voluntarios que ya rechazaron o cancelaron esta solicitud; no se les vuelve a ofrecer.
  listDeclinedVolunteerIds(requestId: string): Promise<string[]>;
  /**
   * Las recolecciones del voluntario que todavía piden algo de él: por confirmar, en camino o
   * recogidas sin entregar. Las entregadas no salen —ya no hay nada que hacer con ellas— y por
   * eso el panel cuenta las del mes con `countDeliveredInMonth`.
   */
  listForVolunteer(volunteerId: string): Promise<VolunteerPickup[]>;
  // `month` en formato 'YYYY-MM'.
  countDeliveredInMonth(volunteerId: string, month: string): Promise<number>;

  /**
   * Carga de varios voluntarios a la vez.
   *
   * Van en lote y no uno por uno porque la asignación los evalúa a todos: con una consulta por
   * voluntario, agregar personas al programa haría más lenta cada donación.
   */
  listStopsByVolunteer(volunteerIds: string[], date: string): Promise<Record<string, Stop[]>>;
  countByVolunteerInMonth(volunteerIds: string[], month: string): Promise<Record<string, number>>;

  // Devuelve el id de la recolección creada.
  create(pickup: NewPickup): Promise<string>;
  saveAcceptance(id: string): Promise<void>;
  saveCancellation(id: string, reason: string): Promise<void>;
  // Pasos del flujo. Los timestamps los pone la base junto con el estado.
  saveStart(id: string): Promise<void>;
  saveCollection(id: string, items: CollectedItem[]): Promise<void>;
  saveDelivery(id: string, evidencePhotoPath: string): Promise<void>;
}
