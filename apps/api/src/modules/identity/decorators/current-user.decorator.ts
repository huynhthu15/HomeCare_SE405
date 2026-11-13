import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { AppException } from '../../../common/http/app.exception';
import type { AuthenticatedUser } from '../identity.types';

/**
 * The caller, as proven by the access token. ALWAYS take user ids from here —
 * never from the request body or query string (that is how IDOR bugs happen).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) throw AppException.unauthenticated();
    return req.user;
  },
);
