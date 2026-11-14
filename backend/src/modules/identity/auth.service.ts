import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from '@homecare/shared';
import Redis from 'ioredis';
import { AuditService } from '../../common/audit/audit.service';
import { AppException } from '../../common/http/app.exception';
import type { RequestMeta } from '../../common/http/request-meta';
import { authEvents } from '../../common/metrics/metrics';
import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { REDIS } from '../../infra/redis/redis.module';
import { LOGIN_LOCK_SECONDS, LOGIN_MAX_FAILURES, redisKeys } from './identity.types';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

const authUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  technicianCode: true,
} as const;

type AuthUserRow = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

/** Result of a successful sign-in; the controller decides how the refresh token reaches the client. */
export interface IssuedTokens {
  response: AuthResponse;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /** Self-registration is for customers only. Technicians and admins are created by an admin. */
  async register(input: RegisterInput, meta: RequestMeta): Promise<IssuedTokens> {
    const taken = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])] },
      select: { id: true },
    });
    if (taken) throw this.emailTaken();

    const passwordHash = await this.passwords.hash(input.password);

    try {
      const { user, session } = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            phone: input.phone ?? null,
            fullName: input.fullName,
            passwordHash,
            role: 'CUSTOMER',
          },
          select: authUserSelect,
        });
        const session = await this.tokens.createSession(tx, user.id, meta);
        await this.outbox.enqueue(tx, {
          type: 'identity.user_registered',
          aggregateType: 'user',
          aggregateId: user.id,
          payload: { userId: user.id, email: user.email, fullName: user.fullName },
        });
        await this.audit.record(
          {
            action: 'auth.registered',
            entityType: 'user',
            entityId: user.id,
            actorId: user.id,
            actorRole: user.role,
            ip: meta.ip,
          },
          tx,
        );
        return { user, session };
      });

      authEvents.inc({ event: 'registered' });
      return this.issue(user, session.sessionId, session.refreshToken);
    } catch (err) {
      // Lost a race with a concurrent registration for the same email/phone
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw this.emailTaken();
      }
      throw err;
    }
  }

  async login(input: LoginInput, meta: RequestMeta): Promise<IssuedTokens> {
    const identifier = input.identifier.trim();
    const failKey = redisKeys.loginFailures(identifier);

    const failures = Number((await this.redis.get(failKey)) ?? 0);
    if (failures >= LOGIN_MAX_FAILURES) {
      authEvents.inc({ event: 'login_locked_out' });
      throw new AppException(
        'RATE_LIMITED',
        'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: identifier.includes('@')
        ? { email: identifier.toLowerCase() }
        : { technicianCode: identifier.toUpperCase() },
      select: { ...authUserSelect, passwordHash: true },
    });

    const passwordOk = user
      ? await this.passwords.verify(user.passwordHash, input.password)
      : await this.passwords.verifyAgainstDummy(input.password);

    if (!user || !passwordOk) {
      await this.redis.multi().incr(failKey).expire(failKey, LOGIN_LOCK_SECONDS).exec();
      authEvents.inc({ event: 'login_failed' });
      await this.audit.record({
        action: 'auth.login_failed',
        entityType: 'user',
        entityId: user?.id ?? null,
        ip: meta.ip,
        metadata: { identifier },
      });
      throw new AppException(
        'AUTH_INVALID_CREDENTIALS',
        'Tài khoản hoặc mật khẩu không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new AppException(
        'AUTH_ACCOUNT_LOCKED',
        'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.redis.del(failKey);

    const session = await this.prisma.$transaction(async (tx) => {
      const created = await this.tokens.createSession(tx, user.id, meta);
      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await this.audit.record(
        {
          action: 'auth.login_succeeded',
          entityType: 'user',
          entityId: user.id,
          actorId: user.id,
          actorRole: user.role,
          ip: meta.ip,
        },
        tx,
      );
      return created;
    });

    authEvents.inc({ event: 'login_succeeded' });
    return this.issue(user, session.sessionId, session.refreshToken);
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<IssuedTokens> {
    const rotated = await this.tokens.rotate(rawRefreshToken, meta);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: rotated.user.id },
      select: authUserSelect,
    });
    return this.issue(user, rotated.sessionId, rotated.refreshToken);
  }

  async logout(sessionId: string, userId: string, meta: RequestMeta): Promise<void> {
    await this.tokens.revokeSession(sessionId, 'logout');
    await this.audit.record({
      action: 'auth.logout',
      entityType: 'session',
      entityId: sessionId,
      actorId: userId,
      ip: meta.ip,
    });
  }

  async logoutEverywhere(userId: string, meta: RequestMeta): Promise<number> {
    const count = await this.tokens.revokeAllSessions(userId, 'logout_all');
    await this.audit.record({
      action: 'auth.logout_all',
      entityType: 'user',
      entityId: userId,
      actorId: userId,
      ip: meta.ip,
      metadata: { sessions: count },
    });
    return count;
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: authUserSelect,
    });
    if (!user) throw AppException.unauthenticated();
    return toAuthUser(user);
  }

  private async issue(
    user: AuthUserRow,
    sessionId: string,
    refreshToken: string,
  ): Promise<IssuedTokens> {
    const accessToken = await this.tokens.signAccessToken(user, sessionId);
    return {
      refreshToken,
      response: { accessToken, expiresIn: this.tokens.accessTtlSeconds, user: toAuthUser(user) },
    };
  }

  private emailTaken() {
    return AppException.conflict('AUTH_EMAIL_TAKEN', 'Email hoặc số điện thoại đã được sử dụng');
  }
}

export function toAuthUser(user: AuthUserRow): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    technicianCode: user.technicianCode,
  };
}
