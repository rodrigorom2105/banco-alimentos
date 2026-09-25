import type { Tables } from '@/shared/lib/database.types';

export type Profile = Pick<Tables<'users'>, 'first_name' | 'last_name' | 'phone'>;
