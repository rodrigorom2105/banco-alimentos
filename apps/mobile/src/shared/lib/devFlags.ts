// TEMPORAL — solo para probar pantallas mientras no hay cuentas admin/voluntario reales.
// En desarrollo la app muestra las opciones de todos los roles; `__DEV__` es false en una
// build publicada, así que ahí nunca se activa. Los permisos reales siguen en Supabase (RLS):
// acciones como aprobar campañas fallarán si la cuenta no es admin.
// También activa la campaña de ejemplo (features/campaigns/devSample.ts).
// Para quitarlo: borra este archivo, devSample.ts y sus usos (useMyRoles, HelpHub, campaignsApi).
export const DEV_ALL_ROLES = __DEV__;
