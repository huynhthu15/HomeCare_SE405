import { Injectable, Logger, Module } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CoreModule } from './common/core.module';
import { OutboxRelay } from './common/outbox/outbox.relay';

/**
 * Example consumer. TODO(TV4): replace with NotificationsModule listeners
 * (send the welcome email through Mailpit, create an in-app notification...).
 * Handlers must be idempotent — the outbox delivers at-least-once.
 */
@Injectable()
class IdentityEventsLogger {
  private readonly logger = new Logger('IdentityEvents');

  @OnEvent('identity.user_registered')
  onUserRegistered(payload: { userId: string; email: string | null }): void {
    this.logger.log({ payload }, 'New customer registered');
  }
}

/**
 * Root module for the `worker` role: no HTTP traffic, not behind the load balancer.
 * Runs the outbox relay now; later BullMQ processors (payment expiry, dispatch offer timeouts,
 * maintenance reminders) are added here.
 */
@Module({
  imports: [CoreModule],
  providers: [OutboxRelay, IdentityEventsLogger],
})
export class WorkerModule {}
