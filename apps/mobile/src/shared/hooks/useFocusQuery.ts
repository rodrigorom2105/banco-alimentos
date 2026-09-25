import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/shared/lib/errors';

type State<T> = { data: T | null; isLoading: boolean; error: string | null };

const toMessage = (e: unknown) => getErrorMessage(e, 'Ocurrió un error inesperado');

// Carga datos cada vez que la pantalla recibe el foco, así al volver de un formulario se ven
// los cambios. `fetcher` debe venir envuelto en useCallback para no recargar en cada render.
export function useFocusQuery<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ data: null, isLoading: true, error: null });

  const reload = useCallback(
    () =>
      fetcher()
        .then((data) => setState({ data, isLoading: false, error: null }))
        .catch((e) => setState((prev) => ({ ...prev, isLoading: false, error: toMessage(e) }))),
    [fetcher],
  );

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { ...state, reload };
}
