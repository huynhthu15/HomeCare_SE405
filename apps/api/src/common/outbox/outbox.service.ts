import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { DbClient } from '../prisma/prisma.service';

export interface DomainEvent<TPayload extends Prisma.InputJsonValue = Prisma.InputJsonValue> {
  /** e.g. "identity.user_registered", "payments.payment_succeeded" — `<module>.<past_tense_fact>` */
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
}

/**
 * Transactional outbox (write side). Always call inside the same `prisma.$transaction`
 * that changes state, so "state changed" and "event recorded" commit or roll back together.
 * The worker's OutboxRelay delivers events at-least-once -> handlers must be idempotent.
 */
@Injectable()
export class OutboxService {
  async enqueue(tx: DbClient, event: DomainEvent): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        type: event.type,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
      },
    });
  }
}
