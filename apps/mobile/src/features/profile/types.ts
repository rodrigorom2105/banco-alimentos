import type { Enums, Tables } from '@/shared/lib/database.types';

export type Profile = Pick<Tables<'users'>, 'first_name' | 'last_name' | 'phone'>;

export type MyRoles = {
  isAdmin: boolean;
  // null = nunca ha solicitado ser voluntario.
  volunteerStatus: Enums<'volunteer_status'> | null;
};
