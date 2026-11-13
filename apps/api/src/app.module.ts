import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppConfig } from './common/config/app-config';
import { CoreModule } from './common/core.module';
import { HealthController } from './common/health/health.controller';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { MetricsController } from './common/metrics/metrics';
import { REDIS } from './infra/redis/redis.module';
import { IdentityModule, JwtAuthGuard, RolesGuard } from './modules/identity';

/**
 * Root module for the `api` role (HTTP + WebSocket, sits behind the load balancer).
 * Business modules are added to `imports` as each owner builds them:
 *   ProfileModule (TV1), CatalogModule/BookingModule/DispatchModule (TV2),
 *   PaymentsModule (TV3), TechnicianModule/TrackingModule/NotificationsModule (TV4).
 */
@Module({
  imports: [
    CoreModule,
    TerminusModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfig, REDIS],
      useFactory: (config: AppConfig, redis: Redis) => ({
        // Redis storage -> limits are shared by all API replicas behind the load balancer
        storage: new ThrottlerStorageRedisService(redis),
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        skipIf: () => !config.isProduction && config.get('THROTTLE_DISABLED'),
      }),
    }),
    IdentityModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Order matters: rate limit -> authenticate -> authorize
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
