import type { Tables } from './database.types';
import { supabase } from './supabase';

export type Municipality = Pick<Tables<'municipalities'>, 'id' | 'name'>;
export type ProductCategory = Pick<Tables<'product_categories'>, 'id' | 'name' | 'description'>;

// Catálogos fijos que administra BAMX; solo se muestran los activos.
export const catalogsApi = {
  async listMunicipalities(): Promise<Municipality[]> {
    const { data, error } = await supabase
      .from('municipalities')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  },

  async listProductCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name, description')
      .eq('is_active', true)
      .order('id');
    if (error) throw error;
    return data;
  },
};
