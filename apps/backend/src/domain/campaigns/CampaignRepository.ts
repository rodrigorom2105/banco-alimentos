import type { DestinationCampaign } from '../assignment/assignment';
import type {
  Campaign,
  CampaignReview,
  CampaignStatus,
  NewInstitutionalCampaign,
} from './Campaign';

// Puerto: el dominio define qué necesita; la infraestructura decide cómo (Supabase, memoria…).
export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  listByStatus(status: CampaignStatus | null): Promise<Campaign[]>;
  /**
   * Puntos de acopio activos de un municipio, con coordenadas, para elegir a dónde va un
   * donativo. Devuelve `DestinationCampaign` y no `Campaign` porque `Campaign` no guarda las
   * coordenadas: a la revisión de campañas no le hacen falta y aquí son lo único que importa.
   */
  listActiveDestinations(municipalityId: number): Promise<DestinationCampaign[]>;
  saveReview(id: string, review: CampaignReview): Promise<void>;
  markFinished(id: string): Promise<void>;
  // Devuelve el id del centro creado.
  createInstitutional(data: NewInstitutionalCampaign): Promise<string>;
}
