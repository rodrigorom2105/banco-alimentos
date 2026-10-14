import type { Enums, Tables } from '@/shared/lib/database.types';

export type Profile = Pick<Tables<'users'>, 'first_name' | 'last_name' | 'phone'>;

export type MyRoles = {
  isAdmin: boolean;
  // null = nunca ha solicitado ser voluntario.
  volunteerStatus: Enums<'volunteer_status'> | null;
};

/**
 * Todo lo que necesita la pantalla de Ayudar para decidir qué opciones mostrar, en una sola
 * consulta. Es más que `MyRoles` porque las reglas no dependen solo del rol: también de si
 * tiene campañas y de en qué estado está su solicitud de voluntariado.
 */
export type HelpContext = {
  isAdmin: boolean;
  volunteer: {
    status: Enums<'volunteer_status'>;
    submittedAt: string;
    rejectionReason: string | null;
  } | null;
  myCampaigns: {
    count: number;
    // Nombre de la única campaña, para poder decir "Campaña Col. Chapalita" en lugar de
    // "Mis campañas" cuando solo tiene una. null si tiene varias o ninguna.
    onlyName: string | null;
  };
  myDonations: {
    count: number;
    // Solicitudes `pending` o `assigned`: las que todavía esperan algo del donador.
    openCount: number;
  };
};
