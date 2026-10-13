// Modo de prueba: muestra las opciones de admin y de voluntario sin tener esos roles en la base.
// Apagado por defecto. Para encenderlo pon EXPO_PUBLIC_DEV_ALL_ROLES=true en apps/mobile/.env y
// reinicia Expo. `__DEV__` es false en una build publicada, así que ahí nunca se activa aunque la
// variable quede encendida por error.
// Nunca aplica sin sesión: useMyRoles devuelve todos los roles en false para un invitado.
// Los permisos reales siguen en Supabase (RLS): aprobar una campaña falla si la cuenta no es admin.
export const DEV_ALL_ROLES = __DEV__ && process.env.EXPO_PUBLIC_DEV_ALL_ROLES === 'true';
