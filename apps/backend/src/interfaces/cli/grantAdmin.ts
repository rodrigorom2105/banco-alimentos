import { buildContainer } from '../../container';
import { DomainError } from '../../domain/shared/errors';
import { loadEnv } from '../../infrastructure/config/env';

// Uso: pnpm --filter backend grant-admin correo@ejemplo.com
// Sirve para crear el primer admin (por HTTP solo otro admin puede asignar el rol).
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: pnpm --filter backend grant-admin <correo>');
    process.exit(1);
  }

  const { useCases } = buildContainer(loadEnv());
  const result = await useCases.grantAdminRole.execute(null, email);
  console.log(
    result.alreadyAdmin
      ? `${email} ya era admin.`
      : `Listo: ${email} ahora es admin (id ${result.userId}).`,
  );
}

main().catch((error: unknown) => {
  // Errores esperados (de negocio o de configuración) se muestran sin el stack trace.
  const isExpected =
    error instanceof DomainError ||
    (error instanceof Error && error.message.startsWith('Configuración inválida'));
  console.error(isExpected ? (error as Error).message : error);
  process.exit(1);
});
