import { describe, expect, it } from 'vitest';

import { ForbiddenError, NotFoundError } from '../../domain/shared/errors';
import { InMemoryUserRepository } from '../../test-support/inMemory';
import { GrantAdminRole } from './grantAdminRole';

describe('GrantAdminRole', () => {
  it('desde la terminal (sin actor) crea el primer admin', async () => {
    const users = new InMemoryUserRepository({ 'sheldon@correo.com': 'u1' });
    const result = await new GrantAdminRole(users).execute(null, ' Sheldon@Correo.com ');
    expect(result).toEqual({ userId: 'u1', alreadyAdmin: false });
    expect(users.grants).toEqual([{ userId: 'u1', grantedBy: null }]);
  });

  it('un admin puede asignar el rol y queda registrado quién lo dio', async () => {
    const users = new InMemoryUserRepository({ 'nuevo@correo.com': 'u2' });
    await new GrantAdminRole(users).execute({ userId: 'a1', isAdmin: true }, 'nuevo@correo.com');
    expect(users.grants).toEqual([{ userId: 'u2', grantedBy: 'a1' }]);
  });

  it('no duplica el rol si ya lo tiene', async () => {
    const users = new InMemoryUserRepository({ 'x@correo.com': 'u3' });
    await users.grantRole('u3', 'admin', null);
    const result = await new GrantAdminRole(users).execute(null, 'x@correo.com');
    expect(result.alreadyAdmin).toBe(true);
    expect(users.grants).toHaveLength(1);
  });

  it('un usuario normal no puede asignarlo', async () => {
    const users = new InMemoryUserRepository({ 'x@correo.com': 'u3' });
    await expect(
      new GrantAdminRole(users).execute({ userId: 'u9', isAdmin: false }, 'x@correo.com'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('avisa si la cuenta no existe', async () => {
    const users = new InMemoryUserRepository({});
    await expect(
      new GrantAdminRole(users).execute(null, 'nadie@correo.com'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
