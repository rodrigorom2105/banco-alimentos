import { useEffect, useState } from 'react';

import { catalogsApi, type Municipality, type ProductCategory } from '@/shared/lib/catalogs';
import { getErrorMessage } from '@/shared/lib/errors';

function useCatalog<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load()
      .then(setItems)
      .catch((e) => setError(getErrorMessage(e, 'No se pudo cargar el catálogo')));
  }, [load]);

  return { items, error };
}

export const useMunicipalities = () => useCatalog<Municipality>(catalogsApi.listMunicipalities);

export const useProductCategories = () =>
  useCatalog<ProductCategory>(catalogsApi.listProductCategories);
