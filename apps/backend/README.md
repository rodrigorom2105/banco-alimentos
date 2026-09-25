# Backend

API de BAMX Conecta en Express + TypeScript. Hace lo que la app móvil no puede hacer por sí sola porque requiere la llave `service_role` de Supabase (que se salta RLS y **solo** debe vivir aquí).

## Configuración

1. Desde la raíz del monorepo: `pnpm install`
2. Copia `.env.example` como `.env` y llena `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API). El servidor no arranca si falta alguna y dice cuál.

## Comandos

```bash
pnpm dev                          # servidor en modo desarrollo (puerto 3000)
pnpm test                         # pruebas (vitest)
pnpm typecheck                    # TypeScript sin compilar
pnpm lint                         # ESLint
pnpm build && pnpm start          # compilar y correr en producción
pnpm grant-admin correo@dominio   # asignar rol admin a una cuenta existente
```

Desde la raíz: `pnpm dev:backend` o `pnpm --filter backend <comando>`.

## Arquitectura (Clean Architecture)

Las dependencias apuntan hacia adentro: `interfaces → application → domain`. `infrastructure` implementa los puertos que define el dominio, y `container.ts` conecta todo.

```
src/
├── domain/            # Reglas de negocio puras. No importa Express ni Supabase.
│   ├── campaigns/     # Entidad Campaign, transiciones de estado, CampaignRepository (puerto)
│   ├── users/         # UserRepository (puerto) y roles
│   └── shared/        # Errores de dominio (NotFound, Forbidden, Conflict…)
├── application/       # Casos de uso: validan permisos y orquestan el dominio
│   ├── campaigns/     # Aprobar, rechazar, listar para revisión, finalizar
│   ├── users/         # Asignar rol admin
│   └── ports.ts       # Actor, AuthService, Clock
├── infrastructure/    # Adaptadores concretos
│   ├── config/        # Variables de entorno validadas con zod
│   ├── supabase/      # Cliente service_role y repositorios
│   └── clock.ts       # Fecha de hoy en hora de Guadalajara
├── interfaces/        # Entradas al sistema
│   ├── http/          # Express: app, middlewares (auth, errores) y rutas
│   └── cli/           # Comandos de terminal (grant-admin)
├── test-support/      # Adaptadores en memoria para las pruebas
├── container.ts       # Raíz de composición (inyección de dependencias)
└── main.ts            # Arranque del servidor
```

**Para agregar una funcionalidad:** regla en `domain/` → caso de uso en `application/` (con su prueba usando los adaptadores en memoria) → implementación en `infrastructure/` si necesita datos nuevos → ruta en `interfaces/http/routes/` → registrarlo en `container.ts`.

## Endpoints

Todos, excepto `/health`, requieren `Authorization: Bearer <access token de Supabase>` (el que ya tiene la app en `supabase.auth.getSession()`).

| Método | Ruta                              | Quién               | Qué hace                                                |
| ------ | --------------------------------- | ------------------- | ------------------------------------------------------- |
| GET    | `/health`                         | público             | Estado del servidor                                     |
| GET    | `/admin/campaigns?status=pending` | admin               | Lista campañas (filtro opcional por estado)             |
| POST   | `/admin/campaigns/:id/approve`    | admin               | Aprueba; pasa a `active` si su fecha de inicio ya llegó |
| POST   | `/admin/campaigns/:id/reject`     | admin               | Rechaza. Body: `{ "reason": "..." }`                    |
| POST   | `/campaigns/:id/finish`           | organizador o admin | Finaliza una campaña aprobada o activa                  |
| POST   | `/admin/admins`                   | admin               | Asigna rol admin. Body: `{ "email": "..." }`            |

Errores: `{ "error": "CODIGO", "message": "..." }` con 400 (datos inválidos), 401 (sin sesión), 403 (sin permiso), 404 (no existe) o 409 (acción inválida para el estado actual).
