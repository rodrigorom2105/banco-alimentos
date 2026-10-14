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
  // Candidatos posibles para una recolección en ese municipio. El resto de las condiciones
  // (día, horario, topes) las revisa el dominio: no son un filtro de la consulta.
  listApprovedByMunicipality(municipalityId: number): Promise<Volunteer[]>;
  saveReview(id: string, review: VolunteerReview): Promise<void>;
  // Guarda los datos corregidos y regresa la solicitud a `pending`.
  saveResubmission(id: string, data: VolunteerResubmission): Promise<void>;
}
