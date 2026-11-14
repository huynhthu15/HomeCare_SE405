import { Injectable, Logger } from '@nestjs/common';
import type { UserRole } from '@homecare/shared';
import type { Prisma } from '../../generated/prisma/client';
import { DbClient, PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorRole?: UserRole | null;
  ip?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append-only audit trail. Pass `tx` to write in the same transaction as the change being audited
 * (then a failure rolls both back). Without `tx` the write is best-effort and never breaks the caller.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, tx?: DbClient): Promise<void> {
    const data = {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      actorId: entry.actorId ?? null,
      actorRole: entry.actorRole ?? null,
      ip: entry.ip ?? null,
      metadata: entry.metadata,
    };

    if (tx) {
      await tx.auditLog.create({ data });
      return;
    }

    try {
      await this.prisma.auditLog.create({ data });
    } catch (err) {
      this.logger.error({ err, action: entry.action }, 'Failed to write audit log');
    }
  }
}
