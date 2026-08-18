# Guía de contribución

## Requisitos previos

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Extensiones de VSCode recomendadas (VSCode te las va a sugerir automáticamente al abrir el proyecto — dale "Install" cuando aparezca la notificación)

## Instalación

\`\`\`bash
git clone https://github.com/tu-usuario/banco-alimentos.git
cd banco-alimentos
pnpm install
\`\`\`

## Desarrollo

\`\`\`bash
pnpm dev:backend # levanta el backend
pnpm dev:mobile # levanta Expo
\`\`\`

## Convención de ramas

Crea una rama por feature/fix, nunca trabajes directo en `main`:

\`\`\`
tipo/descripcion-corta
\`\`\`

Tipos disponibles:

- `feature/` — funcionalidad nueva (ej. `feature/login-usuarios`)
- `fix/` — corrección de bug (ej. `fix/error-token-expirado`)
- `chore/` — tareas de mantenimiento, configuración, dependencias (ej. `chore/actualizar-eslint`)
- `refactor/` — cambios de código sin alterar funcionalidad (ej. `refactor/controladores-auth`)
- `docs/` — cambios solo de documentación (ej. `docs/actualizar-readme`)

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/). El formato es:

\`\`\`
tipo(alcance opcional): descripción corta en minúsculas
\`\`\`

Tipos más comunes:

- `feat:` — nueva funcionalidad
- `fix:` — corrección de bug
- `chore:` — configuración, dependencias, tareas sin impacto en el usuario final
- `refactor:` — cambio de código que no arregla un bug ni agrega funcionalidad
- `docs:` — solo documentación
- `style:` — cambios de formato (sin afectar lógica)
- `test:` — agregar o corregir tests

Ejemplos:
\`\`\`
feat(backend): agregar endpoint de login
fix(mobile): corregir crash al abrir pantalla de perfil
chore: actualizar dependencias de expo
docs: agregar instrucciones de instalación
\`\`\`

## Antes de hacer commit

No necesitas correr Prettier o ESLint manualmente — un hook de Husky los corre automáticamente sobre los archivos que modificaste en cada commit. Si ves que un commit "cambió" líneas que tú no tocaste (comillas, punto y coma, indentación), es Prettier normalizando el formato; es el comportamiento esperado.

Si el hook de pre-commit falla, lee el error: normalmente es un problema de sintaxis o una regla de ESLint que hay que corregir antes de poder commitear.

## Flujo de trabajo

1. Crea tu rama desde `main` actualizado:
   \`\`\`bash
   git checkout main
   git pull
   git checkout -b feature/nombre-descriptivo
   \`\`\`
2. Haz tus cambios y commitea siguiendo la convención de arriba.
3. Sube tu rama y abre un Pull Request hacia `main`:
   \`\`\`bash
   git push -u origin feature/nombre-descriptivo
   \`\`\`
4. Pide revisión de al menos un compañero antes de mergear.
5. Usa "Squash and merge" al mergear el PR para mantener el historial de `main` limpio.
