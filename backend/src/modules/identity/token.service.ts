import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenClaims, UserRole } from '@homecare/shared';
import Redis from 'ioredis';
import { AuditService } from '../../common/audit/audit.service';
import { AppConfig } from '../../common/config/app-config';
import { AppException } from '../../common/http/app.exception';
import type { RequestMeta } from '../../common/http/request-meta';
import { authEvents } from '../../common/metrics/metrics';
import { DbClient, PrismaService } from '../../common/prisma/prisma.service';
import { REDIS } from '../../infra/redis/redis.module';
import { redisKeys } from './identity.types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export interface RotatedSession {
  user: { id: string; role: UserRole };
  sessionId: string;
  refreshToken: string;
}

/**
 * Access tokens: short-lived HS256 JWTs (stateless -> any API replica can verify them).
 * Refresh tokens: opaque, stored hashed, rotated on every use, bound to a Session.
 * Revocation: a revoked session id is written to Redis for the remaining access-token lifetime,
 * so logout / account lock take effect immediately on every replica.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
    private readonly audit: AuditService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  get accessTtlSeconds(): number {
    return this.config.get('JWT_ACCESS_TTL_SECONDS');
  }

  private get refreshTtlMs(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS') * DAY_MS;
  }

  signAccessToken(user: { id: string; role: UserRole }, sessionId: string): Promise<string> {
    const claims: AccessTokenClaims = { sub: user.id, role: user.role, sid: sessionId };
    return this.jwt.signAsync(claims);
  }

  /** Verifies signature, expiry, issuer/audience and that the session was not revoked. */
  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token);
    } catch {
      throw AppException.unauthenticated('Phiên đăng nhập đã hết hạn');
    }
    if (await this.isSessionRevoked(claims.sid)) {
      throw AppException.unauthenticated('Phiên đăng nhập đã bị thu hồi');
    }
    return claims;
  }

  /** Creates a device session + first refresh token. Call inside the login/register transaction. */
  async createSession(
    tx: DbClient,
    userId: string,
    meta: RequestMeta,
  ): Promise<{ sessionId: string; refreshToken: string }> {
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);
    const session = await tx.session.create({
      data: { userId, ip: meta.ip, userAgent: meta.userAgent, expiresAt },
    });
    const refreshToken = generateRefreshToken();
    await tx.refreshToken.create({
      data: { sessionId: session.id, tokenHash: hashRefreshToken(refreshToken), expiresAt },
    });
    return { sessionId: session.id, refreshToken };
  }

  /**
   * Refresh-token rotation with reuse detection (OAuth 2.0 Security BCP §4.14).
   * If a token that was already rotated is presented again, someone else holds a copy:
   * the entire session is revoked and both parties must log in again.
   */
  async rotate(raw: string, meta: RequestMeta): Promise<RotatedSession> {
    const now = new Date();
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(raw) },
      include: {
        session: { include: { user: { select: { id: true, role: true, status: true } } } },
      },
    });

    if (!record) throw this.invalidRefresh();
    const { session } = record;

    if (record.usedAt) {
      await this.handleReuse(session.id, session.user.id, meta);
      throw this.reusedRefresh();
    }
    if (session.revokedAt || session.expiresAt <= now || record.expiresAt <= now) {
      throw this.invalidRefresh();
    }
    if (session.user.status !== 'ACTIVE') {
      await this.revokeSession(session.id, 'account_locked');
      throw this.invalidRefresh();
    }

    const next = generateRefreshToken();
    const newExpiry = new Date(now.getTime() + this.refreshTtlMs); // sliding session
    const rotated = await this.prisma.$transaction(async (tx) => {
      // Conditional update = atomic claim. Two concurrent requests with the same token:
      // exactly one wins, the other is treated as reuse.
      const claimed = await tx.refreshToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return false;
      await tx.refreshToken.create({
        data: { sessionId: session.id, tokenHash: hashRefreshToken(next), expiresAt: newExpiry },
      });
      await tx.session.update({
        where: { id: session.id },
        data: { lastUsedAt: now, expiresAt: newExpiry, ip: meta.ip, userAgent: meta.userAgent },
      });
      return true;
    });

    if (!rotated) {
      await this.handleReuse(session.id, session.user.id, meta);
      throw this.reusedRefresh();
    }

    authEvents.inc({ event: 'refresh_rotated' });
    return {
      user: { id: session.user.id, role: session.user.role },
      sessionId: session.id,
      refreshToken: next,
    };
  }

  async revokeSession(sessionId: string, reason: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
    await this.redis.set(redisKeys.revokedSession(sessionId), reason, 'EX', this.accessTtlSeconds);
  }

  async revokeAllSessions(userId: string, reason: string): Promise<number> {
    const active = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });
    if (active.length === 0) return 0;
    await this.prisma.session.updateMany({
      where: { id: { in: active.map((s) => s.id) } },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
    const pipeline = this.redis.pipeline();
    for (const s of active) {
      pipeline.set(redisKeys.revokedSession(s.id), reason, 'EX', this.accessTtlSeconds);
    }
    await pipeline.exec();
    return active.length;
  }

  private async isSessionRevoked(sessionId: string): Promise<boolean> {
    try {
      return (await this.redis.exists(redisKeys.revokedSession(sessionId))) === 1;
    } catch (err) {
      // Fail closed: if we cannot check revocation we do not accept the token.
      this.logger.error({ err }, 'Redis unavailable while checking session revocation');
      throw new AppException(
        'INTERNAL',
        'Hệ thống đang bận, vui lòng thử lại',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async handleReuse(sessionId: string, userId: string, meta: RequestMeta): Promise<void> {
    authEvents.inc({ event: 'refresh_reuse_detected' });
    this.logger.warn({ sessionId, userId }, 'Refresh token reuse detected — revoking session');
    await this.revokeSession(sessionId, 'refresh_token_reuse');
    await this.audit.record({
      action: 'auth.refresh_reuse_detected',
      entityType: 'session',
      entityId: sessionId,
      actorId: userId,
      ip: meta.ip,
    });
  }

  private invalidRefresh() {
    return AppException.unauthenticated('Phiên đăng nhập đã hết hạn', 'AUTH_REFRESH_INVALID');
  }

  private reusedRefresh() {
    return AppException.unauthenticated(
      'Phát hiện phiên đăng nhập bất thường, vui lòng đăng nhập lại',
      'AUTH_REFRESH_REUSED',
    );
  }
}
