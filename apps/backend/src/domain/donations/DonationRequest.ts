import type { RequestToAssign } from '../assignment/assignment';
import type { PickupStatus } from '../pickups/Pickup';

export type DonationRequestStatus = 'pending' | 'assigned' | 'completed' | 'cancelled';

/**
 * Una solicitud de donación desde casa.
 *
 * Extiende `RequestToAssign`, que es lo que el algoritmo de asignación necesita saber de ella.
 * La separación no es un capricho: así las funciones de `assignment.ts` se pueden probar con un
 * objeto mínimo, sin inventar un estado ni datos que no usan.
 */
export type DonationRequest = RequestToAssign & {
  status: DonationRequestStatus;
  // Para los avisos: "una donación de Tonalá se quedó sin voluntario" dice más que un uuid.
  municipalityName: string;
};

// La propuesta viva de una solicitud, si tiene alguna. `acceptedAt` en null = sin responder.
export type ActiveOffer = {
  pickupId: string;
  volunteerId: string;
  volunteerName: string;
  status: PickupStatus;
  assignedAt: string;
  acceptedAt: string | null;
};

/**
 * Una solicitud como la ve el admin en "Donaciones sin voluntario". Trae los datos para
 * identificarla de un golpe (quién, dónde, cuándo) y su propuesta actual, para poder distinguir
 * "nadie la ha tomado" de "se le propuso a alguien que no contestó".
 */
export type OpenDonationRequest = DonationRequest & {
  donorName: string;
  address: string;
  itemsCount: number;
  createdAt: string;
  offer: ActiveOffer | null;
};
