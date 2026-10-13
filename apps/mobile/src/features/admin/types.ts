import type { Enums } from '@/shared/lib/database.types';

export type VolunteerStatus = Enums<'volunteer_status'>;
export type SupportStatus = Enums<'support_status'>;
export type SupportType = Enums<'support_type'>;
export type Weekday = Enums<'weekday'>;

// Lo que devuelve GET /admin/volunteers. Son los campos de la entidad del backend, en
// camelCase, porque vienen de él y no de Supabase.
export type VolunteerForReview = {
  id: string;
  userId: string;
  status: VolunteerStatus;
  firstName: string;
  lastName: string;
  phone: string | null;
  municipalityIds: number[];
  availableDays: Weekday[];
  availableFrom: string;
  availableTo: string;
  photoPath: string;
  proofOfAddressPath: string;
  rejectionReason: string | null;
  createdAt: string;
};

export type SupportRequestForReview = {
  id: string;
  campaignId: string;
  campaignName: string;
  requestedBy: string;
  type: SupportType;
  description: string;
  neededBy: string | null;
  status: SupportStatus;
  responseMessage: string | null;
  createdAt: string;
};

export type NewCenter = {
  name: string;
  description: string | null;
  address: string;
  municipalityId: number;
  latitude: number;
  longitude: number;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  contactPhone: string | null;
};
