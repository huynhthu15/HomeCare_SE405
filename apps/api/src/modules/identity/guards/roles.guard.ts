import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@homecare/shared';
import type { Request } from 'express';
import { AppException } from '../../../common/http/app.exception';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Global guard, runs after JwtAuthGuard. Role checks answer "may this kind of user call this route";
 * ownership checks ("is this booking yours?") still belong in the service layer.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<Request>();
    if (!user) throw AppException.unauthenticated();
    if (!required.includes(user.role)) throw AppException.forbidden();
    return true;
  }
}
