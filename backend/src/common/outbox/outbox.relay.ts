import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';

const BATCH_SIZE = 50;
/** After this many failed deliveries the event is parked (left unpublished) for manual inspection. */
const MAX_ATTEMPTS = 10;

/**
 * Outbox relay (read side) — runs only in the `worker` role.
 * Uses `FOR UPDATE SKIP LOCKED`, so several worker replicas can poll concurrently without
 * delivering the same event twice at the same time.
 * Subscribe with `@OnEvent('identity.user_registered')` in any provider loaded by WorkerModule.
 */
@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxRelay.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly config: AppConfig,
  ) {}

  onApplicationBootstrap(): void {
    const every = this.config.get('OUTBOX_POLL_MS');
    this.timer = setInterval(() => void this.tick(), every);
    this.logger.log(`Outbox relay polling every ${every}ms`);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Public for tests. Returns how many events were published. */
  async tick(): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM outbox_events
          WHERE published_at IS NULL AND attempts < ${MAX_ATTEMPTS}
          ORDER BY created_at
          LIMIT ${BATCH_SIZE}
          FOR UPDATE SKIP LOCKED`;
        if (locked.length === 0) return 0;

        const events = await tx.outboxEvent.findMany({
          where: { id: { in: locked.map((r) => r.id) } },
          orderBy: { createdAt: 'asc' },
        });

        let published = 0;
        for (const event of events) {
          try {
            await this.events.emitAsync(event.type, event.payload);
            await tx.outboxEvent.update({
              where: { id: event.id },
              data: { publishedAt: new Date(), attempts: { increment: 1 } },
            });
            published += 1;
          } catch (err) {
            this.logger.warn(
              { err, eventId: event.id, type: event.type },
              'Outbox delivery failed',
            );
            await tx.outboxEvent.update({
              where: { id: event.id },
              data: { attempts: { increment: 1 }, lastError: String(err).slice(0, 1000) },
            });
          }
        }
        return published;
      });
    } catch (err) {
      this.logger.error({ err }, 'Outbox relay tick failed');
      return 0;
    } finally {
      this.running = false;
    }
  }
}
