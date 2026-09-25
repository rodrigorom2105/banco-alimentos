export type Role = 'admin';

export interface UserRepository {
  findIdByEmail(email: string): Promise<string | null>;
  hasRole(userId: string, role: Role): Promise<boolean>;
  // grantedBy = null significa que se asignó desde la terminal (sin otro admin).
  grantRole(userId: string, role: Role, grantedBy: string | null): Promise<void>;
}
