// Tipos de la base de Supabase, escritos a partir de bamx-conecta-db-schema.md (scripts 01–03).
// Mismo formato que `npx supabase gen types typescript --project-id jjxkpiratzlvzxlmzhin`:
// si cambia el esquema, regenéralos con ese comando y reemplaza este archivo.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
        } & Timestamps;
        Insert: { id: string; first_name: string; last_name: string; phone?: string | null };
        Update: { first_name?: string; last_name?: string; phone?: string | null };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: Database['public']['Enums']['user_role'];
          granted_at: string;
          granted_by: string | null;
        };
        Insert: {
          user_id: string;
          role: Database['public']['Enums']['user_role'];
          granted_at?: string;
          granted_by?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: { name: string; description?: string | null; is_active?: boolean };
        Update: { name?: string; description?: string | null; is_active?: boolean };
        Relationships: [];
      };
      municipalities: {
        Row: { id: number; name: string; is_active: boolean; created_at: string };
        Insert: { name: string; is_active?: boolean };
        Update: { name?: string; is_active?: boolean };
        Relationships: [];
      };
      volunteer_municipalities: {
        Row: { volunteer_id: string; municipality_id: number };
        Insert: { volunteer_id: string; municipality_id: number };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'volunteer_municipalities_volunteer_id_fkey';
            columns: ['volunteer_id'];
            isOneToOne: false;
            referencedRelation: 'volunteers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'volunteer_municipalities_municipality_id_fkey';
            columns: ['municipality_id'];
            isOneToOne: false;
            referencedRelation: 'municipalities';
            referencedColumns: ['id'];
          },
        ];
      };
      volunteers: {
        Row: {
          id: string;
          user_id: string;
          photo_path: string;
          proof_of_address_path: string;
          available_days: Database['public']['Enums']['weekday'][];
          available_from: string;
          available_to: string;
          privacy_accepted_at: string;
          terms_accepted_at: string;
          validation_status: Database['public']['Enums']['volunteer_status'];
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
        } & Timestamps;
        Insert: {
          user_id: string;
          photo_path: string;
          proof_of_address_path: string;
          available_days: Database['public']['Enums']['weekday'][];
          available_from: string;
          available_to: string;
          privacy_accepted_at: string;
          terms_accepted_at: string;
        };
        Update: {
          photo_path?: string;
          proof_of_address_path?: string;
          available_days?: Database['public']['Enums']['weekday'][];
          available_from?: string;
          available_to?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'volunteers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          type: Database['public']['Enums']['campaign_type'];
          status: Database['public']['Enums']['campaign_status'];
          name: string;
          description: string | null;
          organizer_id: string | null;
          address: string;
          municipality_id: number;
          latitude: number;
          longitude: number;
          start_date: string | null;
          end_date: string | null;
          schedule: string | null;
          contact_phone: string | null;
          cover_image_url: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
        } & Timestamps;
        Insert: {
          type: Database['public']['Enums']['campaign_type'];
          name: string;
          description?: string | null;
          organizer_id?: string | null;
          address: string;
          municipality_id: number;
          latitude: number;
          longitude: number;
          start_date?: string | null;
          end_date?: string | null;
          schedule?: string | null;
          contact_phone?: string | null;
          cover_image_url?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          schedule?: string | null;
          contact_phone?: string | null;
          cover_image_url?: string | null;
          type?: Database['public']['Enums']['campaign_type'];
          address?: string;
          municipality_id?: number;
          latitude?: number;
          longitude?: number;
          start_date?: string | null;
          end_date?: string | null;
          // Solo admins (RLS): revisión y cambio de estado.
          status?: Database['public']['Enums']['campaign_status'];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'campaigns_organizer_id_fkey';
            columns: ['organizer_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaigns_municipality_id_fkey';
            columns: ['municipality_id'];
            isOneToOne: false;
            referencedRelation: 'municipalities';
            referencedColumns: ['id'];
          },
        ];
      };
      support_requests: {
        Row: {
          id: string;
          campaign_id: string;
          requested_by: string;
          type: Database['public']['Enums']['support_type'];
          description: string;
          needed_by: string | null;
          status: Database['public']['Enums']['support_status'];
          response_message: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        } & Timestamps;
        Insert: {
          campaign_id: string;
          requested_by: string;
          type: Database['public']['Enums']['support_type'];
          description: string;
          needed_by?: string | null;
        };
        Update: { status?: Database['public']['Enums']['support_status'] };
        Relationships: [
          {
            foreignKeyName: 'support_requests_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_requests_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      donation_requests: {
        Row: {
          id: string;
          donor_id: string;
          address: string;
          address_references: string | null;
          municipality_id: number;
          latitude: number;
          longitude: number;
          preferred_date: string;
          preferred_time_from: string;
          preferred_time_to: string;
          notes: string | null;
          preferred_campaign_id: string | null;
          status: Database['public']['Enums']['donation_request_status'];
          cancellation_reason: string | null;
        } & Timestamps;
        Insert: {
          donor_id: string;
          address: string;
          address_references?: string | null;
          municipality_id: number;
          latitude: number;
          longitude: number;
          preferred_date: string;
          preferred_time_from: string;
          preferred_time_to: string;
          notes?: string | null;
          preferred_campaign_id?: string | null;
        };
        Update: {
          address?: string;
          address_references?: string | null;
          preferred_date?: string;
          preferred_time_from?: string;
          preferred_time_to?: string;
          notes?: string | null;
          status?: Database['public']['Enums']['donation_request_status'];
          cancellation_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'donation_requests_donor_id_fkey';
            columns: ['donor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'donation_requests_municipality_id_fkey';
            columns: ['municipality_id'];
            isOneToOne: false;
            referencedRelation: 'municipalities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'donation_requests_preferred_campaign_id_fkey';
            columns: ['preferred_campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
        ];
      };
      donation_items: {
        Row: {
          id: string;
          request_id: string;
          category_id: number;
          description: string;
          quantity: number;
          unit: Database['public']['Enums']['item_unit'];
          collected_quantity: number | null;
          created_at: string;
        };
        Insert: {
          request_id: string;
          category_id: number;
          description: string;
          quantity: number;
          unit: Database['public']['Enums']['item_unit'];
        };
        Update: {
          category_id?: number;
          description?: string;
          quantity?: number;
          unit?: Database['public']['Enums']['item_unit'];
          collected_quantity?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'donation_items_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'donation_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'donation_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'product_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      pickups: {
        Row: {
          id: string;
          request_id: string;
          volunteer_id: string;
          destination_campaign_id: string;
          status: Database['public']['Enums']['pickup_status'];
          assigned_at: string;
          on_the_way_at: string | null;
          collected_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          evidence_photo_path: string | null;
          confirmed_by: string | null;
          confirmed_at: string | null;
        } & Timestamps;
        Insert: { request_id: string; volunteer_id: string };
        Update: {
          status?: Database['public']['Enums']['pickup_status'];
          cancellation_reason?: string | null;
          evidence_photo_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pickups_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'donation_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pickups_volunteer_id_fkey';
            columns: ['volunteer_id'];
            isOneToOne: false;
            referencedRelation: 'volunteers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pickups_destination_campaign_id_fkey';
            columns: ['destination_campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    // get_available_donation_requests() y get_request_volunteer() existen, pero su firma no está
    // en el documento; se agregan al regenerar los tipos.
    Functions: { [_ in never]: never };
    Enums: {
      user_role: 'admin';
      volunteer_status: 'pending' | 'approved' | 'rejected' | 'suspended';
      weekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
      campaign_type: 'institutional' | 'community';
      campaign_status: 'pending' | 'approved' | 'rejected' | 'active' | 'finished';
      support_type: 'containers' | 'promotion' | 'material' | 'other';
      support_status: 'pending' | 'approved' | 'rejected' | 'delivered' | 'cancelled';
      donation_request_status: 'pending' | 'assigned' | 'completed' | 'cancelled';
      item_unit: 'piece' | 'package' | 'box' | 'kg' | 'g' | 'liter' | 'ml';
      pickup_status: 'assigned' | 'on_the_way' | 'collected' | 'delivered' | 'cancelled';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
