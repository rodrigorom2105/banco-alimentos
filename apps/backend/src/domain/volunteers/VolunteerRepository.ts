import type { Volunteer, VolunteerReview, VolunteerStatus } from './Volunteer';

// Puerto: el dominio define qué necesita; la infraestructura decide cómo.
export interface VolunteerRepository {
  findById(id: string): Promise<Volunteer | null>;
  listByStatus(status: VolunteerStatus | null): Promise<Volunteer[]>;
  saveReview(id: string, review: VolunteerReview): Promise<void>;
}
