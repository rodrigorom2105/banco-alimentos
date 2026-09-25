import type { Enums, Tables } from '@/shared/lib/database.types';

export type CampaignType = Enums<'campaign_type'>;

export type Campaign = Pick<
  Tables<'campaigns'>,
  | 'id'
  | 'type'
  | 'name'
  | 'description'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'start_date'
  | 'end_date'
  | 'schedule'
  | 'contact_phone'
  | 'cover_image_url'
> & {
  municipality: Pick<Tables<'municipalities'>, 'id' | 'name'> | null;
};
