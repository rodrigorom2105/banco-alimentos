import type { Campaign } from '@/features/campaigns';

export type ExploreCampaign = Campaign & { distanceKm: number | null };

export type SortOption = 'nearest' | 'farthest' | 'opening' | 'closing';
