import { supabase } from '@/shared/lib/supabase';

import type { HelpContext, MyRoles, Profile } from '../types';

export const profileApi = {
  // RLS solo deja leer la fila propia, así que basta con filtrar por el id del usuario.
  async getMine(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updatePhone(userId: string, phone: string) {
    const { error } = await supabase.from('users').update({ phone }).eq('id', userId);
    if (error) throw error;
  },

  // Admin se guarda en user_roles; voluntario se deriva de su solicitud en volunteers.
  async getMyRoles(userId: string): Promise<MyRoles> {
    const [roles, volunteer] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.from('volunteers').select('validation_status').eq('user_id', userId).maybeSingle(),
    ]);
    if (roles.error) throw roles.error;
    if (volunteer.error) throw volunteer.error;
    return {
      isAdmin: roles.data.some((r) => r.role === 'admin'),
      volunteerStatus: volunteer.data?.validation_status ?? null,
    };
  },

  /**
   * Contexto de la pantalla de Ayudar: rol, solicitud de voluntariado y campañas propias.
   *
   * Las tres consultas van en paralelo porque son independientes. RLS hace el filtrado: de
   * `campaigns` solo llegan las del usuario (y de un admin llegarían todas, por eso se filtra
   * explícitamente por `organizer_id`).
   */
  async getHelpContext(userId: string): Promise<HelpContext> {
    const [roles, volunteer, campaigns, donations] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase
        .from('volunteers')
        .select('validation_status, rejection_reason, created_at')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('campaigns').select('name').eq('organizer_id', userId),
      // RLS ya limita `donation_requests` a las propias.
      supabase.from('donation_requests').select('status'),
    ]);
    if (roles.error) throw roles.error;
    if (volunteer.error) throw volunteer.error;
    if (campaigns.error) throw campaigns.error;
    if (donations.error) throw donations.error;

    return {
      isAdmin: roles.data.some((r) => r.role === 'admin'),
      volunteer: volunteer.data
        ? {
            status: volunteer.data.validation_status,
            submittedAt: volunteer.data.created_at,
            rejectionReason: volunteer.data.rejection_reason,
          }
        : null,
      myCampaigns: {
        count: campaigns.data.length,
        onlyName: campaigns.data.length === 1 ? campaigns.data[0].name : null,
      },
      myDonations: {
        count: donations.data.length,
        openCount: donations.data.filter((d) => d.status === 'pending' || d.status === 'assigned')
          .length,
      },
    };
  },
};
