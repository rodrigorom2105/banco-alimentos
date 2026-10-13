import type { SupportRequest, SupportResponse, SupportStatus } from './SupportRequest';

export interface SupportRequestRepository {
  findById(id: string): Promise<SupportRequest | null>;
  listByStatus(status: SupportStatus | null): Promise<SupportRequest[]>;
  saveResponse(id: string, response: SupportResponse): Promise<void>;
}
