import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException } from '../../../common/http/app.exception';
import { IS_PUBLIC_KEY } from '../../../common/http/public.decorator';
import { TokenService } from '../token.service';

/**
 * Global guard (registered in AppModule): every HTTP route needs `Authorization: Bearer <jwt>`
 * unless marked @Public(). WebSocket gateways authenticate in their handshake instead
 * (see TokenService.verifyAccessToken — owner TV4).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(req);
    if (!token) throw AppException.unauthenticated();

    const claims = await this.tokens.verifyAccessToken(token);
    req.user = { id: claims.sub, role: claims.role, sessionId: claims.sid };
    return true;
  }
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}
