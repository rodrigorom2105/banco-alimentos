import type { CampaignType } from '@/features/campaigns';
import { normalizeText as normalize, parseDate } from '@/shared/utils';

import type { ExploreCampaign, SortOption } from './types';

export type ExploreFilters = {
  query: string;
  sort: SortOption;
  municipalityId: number | null;
  type: CampaignType | null;
};

// Busca en nombre, dirección y municipio, sin distinguir acentos ni mayúsculas.
export function matchesQuery(campaign: ExploreCampaign, query: string) {
  const needle = normalize(query.trim());
  if (!needle) return true;
  const haystack = [campaign.name, campaign.address, campaign.municipality?.name ?? '']
    .map(normalize)
    .join(' ');
  return haystack.includes(needle);
}

const time = (value: string | null) => (value ? parseDate(value).getTime() : Infinity);
const distance = (campaign: ExploreCampaign) => campaign.distanceKm ?? Infinity;

const comparators: Record<SortOption, (a: ExploreCampaign, b: ExploreCampaign) => number> = {
  nearest: (a, b) => distance(a) - distance(b),
  farthest: (a, b) => (b.distanceKm ?? -Infinity) - (a.distanceKm ?? -Infinity),
  opening: (a, b) => time(a.start_date) - time(b.start_date),
  closing: (a, b) => time(a.end_date) - time(b.end_date),
};

export function applyFilters(campaigns: ExploreCampaign[], filters: ExploreFilters) {
  return campaigns
    .filter((c) => matchesQuery(c, filters.query))
    .filter((c) => filters.municipalityId === null || c.municipality?.id === filters.municipalityId)
    .filter((c) => filters.type === null || c.type === filters.type)
    .sort(comparators[filters.sort]);
}
