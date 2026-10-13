import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { Href } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/shared/lib/supabase';

// Bandera local: ya se vio el carrusel de bienvenida. Se borra al cerrar sesión para que la
// siguiente persona que use el teléfono vuelva a ver la presentación.
const WELCOME_SEEN_KEY = 'bamx.welcomeSeen';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  // Verificar el código de recuperación crea una sesión; mientras dura el cambio de
  // contraseña hay que seguir en las pantallas de auth en vez de saltar a las tabs.
  isRecoveringPassword: boolean;
  setRecoveringPassword: (value: boolean) => void;
  signOut: () => Promise<void>;
  // Carrusel de bienvenida: se muestra la primera vez que se abre la app y al cerrar sesión.
  hasSeenWelcome: boolean;
  markWelcomeSeen: () => void;
  // Pantalla que el invitado quería abrir antes de que se le pidiera iniciar sesión.
  // La guarda `useRequireAuth` y la consume el layout raíz cuando aparece la sesión.
  pendingRedirect: Href | null;
  setPendingRedirect: (href: Href | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveringPassword, setRecoveringPassword] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<Href | null>(null);

  useEffect(() => {
    // Las dos lecturas van juntas: hasta que terminen no se sabe qué pantalla mostrar, y el
    // layout raíz no dibuja nada mientras `isLoading` sea true (así no parpadea).
    Promise.all([
      supabase.auth.getSession().then(({ data }) => setSession(data.session)),
      // En web el render estático corre en Node, donde AsyncStorage no existe; si falla se
      // asume que no se ha visto el carrusel.
      AsyncStorage.getItem(WELCOME_SEEN_KEY)
        .then((value) => setHasSeenWelcome(value === 'true'))
        .catch(() => setHasSeenWelcome(false)),
    ]).finally(() => setIsLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) =>
      setSession(newSession),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const markWelcomeSeen = () => {
    setHasSeenWelcome(true);
    AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true').catch(() => {});
  };

  const signOut = async () => {
    setPendingRedirect(null);
    setHasSeenWelcome(false);
    await AsyncStorage.removeItem(WELCOME_SEEN_KEY).catch(() => {});
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isRecoveringPassword,
        setRecoveringPassword,
        signOut,
        hasSeenWelcome,
        markWelcomeSeen,
        pendingRedirect,
        setPendingRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
