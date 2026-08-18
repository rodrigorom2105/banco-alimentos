# Banco de Alimentos

## Requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Instalación

```bash
pnpm install
```

## Desarrollo

```bash
pnpm dev:backend   # levanta el backend en modo desarrollo
pnpm dev:mobile    # levanta Expo
```

## Antes de hacer commit

El formato (Prettier) y lint (ESLint) se aplican automáticamente vía Husky en cada commit. No necesitas correr nada manual.

## Para empezar a contribuir

1. **Instala pnpm globalmente antes de clonar**, si no lo tienes:

   ```bash
   npm install -g pnpm
   ```

   El proyecto usa pnpm workspaces para manejar el backend y la app móvil desde un solo repositorio. Usar `npm` o `yarn` en su lugar puede generar un lockfile distinto y romper la instalación de otros.

2. **Instala las extensiones recomendadas de VSCode.** Al abrir el proyecto, VSCode va a mostrar una notificación sugiriendo instalar Prettier, ESLint y EditorConfig (definidas en `.vscode/extensions.json`). Acepta la instalación — sin ellas, tu editor no va a formatear ni marcar errores igual que el resto del equipo mientras escribes.

3. **No te preocupes si un commit modifica líneas que no tocaste.** Un hook de pre-commit (Husky + lint-staged) corre Prettier y ESLint automáticamente antes de cada commit, sobre los archivos que cambiaste. Si ves ajustes de comillas, punto y coma o indentación en tu commit, es ese proceso normalizando el formato — es intencional y evita los diffs gigantes por diferencias de configuración entre editores.

Para la convención de ramas y mensajes de commit, revisa [`CONTRIBUTING.md`](./CONTRIBUTING.md).
