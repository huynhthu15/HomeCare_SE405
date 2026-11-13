import { Injectable } from '@nestjs/common';
import type { UserRole, UserStatus } from '@homecare/shared';
import { AuditService } from '../../common/audit/audit.service';
import { AppException } from '../../common/http/app.exception';
import type { RequestMeta } from '../../common/http/request-meta';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type { AuthenticatedUser } from './identity.types';
import { TokenService } from './token.service';

export interface AdminUserView {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  technicianCode: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

const adminUserSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  status: true,
  technicianCode: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    role?: UserRole;
    status?: UserStatus;
    q?: string;
    page: number;
    pageSize: number;
  }): Promise<Page<AdminUserView>> {
    const where: Prisma.UserWhereInput = {
      role: query.role,
      status: query.status,
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { technicianCode: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: adminUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  /** Locking a user immediately kills all their sessions on every replica. */
  async setStatus(
    actor: AuthenticatedUser,
    userId: string,
    status: UserStatus,
    reason: string,
    meta: RequestMeta,
  ): Promise<AdminUserView> {
    if (actor.id === userId) {
      throw AppException.forbidden('Không thể tự thay đổi trạng thái tài khoản của chính mình');
    }
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) throw AppException.notFound('Không tìm thấy người dùng');

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { status },
        select: adminUserSelect,
      });
      await this.audit.record(
        {
          action: status === 'LOCKED' ? 'admin.user_locked' : 'admin.user_unlocked',
          entityType: 'user',
          entityId: userId,
          actorId: actor.id,
          actorRole: actor.role,
          ip: meta.ip,
          metadata: { reason },
        },
        tx,
      );
      return user;
    });

    if (status === 'LOCKED') {
      await this.tokens.revokeAllSessions(userId, 'account_locked');
    }
    return updated;
  }
}
