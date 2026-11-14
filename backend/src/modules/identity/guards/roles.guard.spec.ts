import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@homecare/shared';
import { AppException } from '../../../common/http/app.exception';
import { RolesGuard } from './roles.guard';

function contextFor(
  user: { id: string; role: UserRole; sessionId: string } | undefined,
): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  afterEach(() => jest.restoreAllMocks());

  it('allows any authenticated user when the route declares no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextFor({ id: 'u1', role: 'CUSTOMER', sessionId: 's' }))).toBe(
      true,
    );
  });

  it('allows a user whose role is listed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(guard.canActivate(contextFor({ id: 'u1', role: 'ADMIN', sessionId: 's' }))).toBe(true);
  });

  it('rejects a customer on an admin route with 403', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    try {
      guard.canActivate(contextFor({ id: 'u1', role: 'CUSTOMER', sessionId: 's' }));
      fail('expected FORBIDDEN');
    } catch (err) {
      expect(err).toBeInstanceOf(AppException);
      expect((err as AppException).getStatus()).toBe(403);
    }
  });

  it('rejects an anonymous request with 401', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(AppException);
  });
});
