# App móvil

App de Banco de Alimentos hecha con [Expo](https://expo.dev) + Expo Router y Supabase.

## Configuración

1. Desde la raíz del monorepo: `pnpm install`
2. Copia `.env.example` como `.env` y llena las credenciales de Supabase.

## Comandos

Desde la raíz del repo:

```bash
pnpm dev:mobile
```

O desde `apps/mobile`:

```bash
pnpm start          # servidor de desarrollo
pnpm web            # versión web
pnpm lint           # ESLint (expo lint)
pnpm typecheck      # TypeScript sin emitir
```

Para agregar dependencias usa siempre `pnpm expo install <paquete>` (resuelve versiones compatibles con el SDK).

## Estructura

```
src/
├── app/          # Rutas (Expo Router): cada archivo es una pantalla
│   ├── (auth)/   # login, registro, recuperar contraseña, bienvenida
│   └── (tabs)/   # pantallas con sesión iniciada
├── features/     # Módulos por dominio: auth, campaigns, profile
│   └── <feature>/{api,components,hooks,types.ts,index.ts}
├── providers/    # Contextos globales (AuthProvider, AppProviders)
└── shared/       # Componentes, tema, cliente de Supabase y utilidades comunes
assets/
├── fonts/
├── icons/
└── images/       # auth/ contiene las ilustraciones de las pantallas de acceso
```
