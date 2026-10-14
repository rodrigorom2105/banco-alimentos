import type { DonationRequest, DonationRequestEdit, OpenDonationRequest } from './DonationRequest';

// Puerto: el dominio define qué necesita; la infraestructura decide cómo.
export interface DonationRequestRepository {
  findById(id: string): Promise<DonationRequest | null>;
  saveDetails(id: string, edit: DonationRequestEdit): Promise<void>;
  /**
   * Solicitudes que todavía pueden recibir un voluntario: las que están `pending` y las
   * `assigned` cuya propuesta nadie respondió. Quién de ellas cuenta como "vencida" lo decide
   * el dominio (`isOfferExpired`), no esta consulta: el plazo es una regla de negocio.
   */
  listOpenForAssignment(): Promise<OpenDonationRequest[]>;
}
