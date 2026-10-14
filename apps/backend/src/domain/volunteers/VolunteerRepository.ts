import type {
  Volunteer,
  VolunteerResubmission,
  VolunteerReview,
  VolunteerStatus,
} from './Volunteer';

// Puerto: el dominio define qué necesita; la infraestructura decide cómo.
export interface VolunteerRepository {
  findById(id: string): Promise<Volunteer | null>;
  // Para que alguien opere sobre SU propia solicitud sin conocer su id.
  findByUserId(userId: string): Promise<Volunteer | null>;
  listByStatus(status: VolunteerStatus | null): Promise<Volunteer[]>;
  saveReview(id: string, review: VolunteerReview): Promise<void>;
  // Guarda los datos corregidos y regresa la solicitud a `pending`.
  saveResubmission(id: string, data: VolunteerResubmission): Promise<void>;
}
