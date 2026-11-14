import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '../infra/redis/redis.module';
import { AuditService } from './audit/audit.service';
import { AppConfig } from './config/app-config';
import { validateEnv } from './config/env.schema';
import { LoggerModule } from './logger/logger.module';
import { OutboxService } from './outbox/outbox.service';
import { PrismaService } from './prisma/prisma.service';

/**
 * Shared kernel used by BOTH process roles (api and worker): config, logging, database,
 * Redis, audit log, outbox, in-process events. Business modules never import each other's
 * internals — they depend on this kernel plus other modules' public `index.ts`.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    LoggerModule,
    RedisModule,
    EventEmitterModule.forRoot({ wildcard: false }),
  ],
  providers: [AppConfig, PrismaService, AuditService, OutboxService],
  exports: [AppConfig, PrismaService, AuditService, OutboxService],
})
export class CoreModule {}
