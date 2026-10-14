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

export type DonationRequestStatus = Enums<'donation_request_status'>;
export type PickupStatus = Enums<'pickup_status'>;

/**
 * Una donación sin voluntario, como la devuelve GET /admin/donation-requests?unassigned=true.
 *
 * `offer` es la propuesta que un voluntario dejó sin responder, y por eso la solicitud sigue
 * atorada. Si viene en null, nadie la tomó nunca.
 */
export type UnassignedDonation = {
  id: string;
  donorName: string;
  address: string;
  municipalityName: string;
  preferredDate: string;
  preferredTimeFrom: string;
  preferredTimeTo: string;
  status: DonationRequestStatus;
  itemsCount: number;
  createdAt: string;
  offer: {
    pickupId: string;
    volunteerName: string;
    status: PickupStatus;
    assignedAt: string;
    acceptedAt: string | null;
  } | null;
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
