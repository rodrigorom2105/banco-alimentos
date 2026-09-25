import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.expo/**'],
  },
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // Los parámetros con _ se ignoran a propósito (ej. `next` en el manejador de errores de Express).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
