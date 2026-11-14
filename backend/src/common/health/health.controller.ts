import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthIndicatorService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import Redis from 'ioredis';
import { REDIS } from '../../infra/redis/redis.module';
import { Public } from '../http/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Probes used by the load balancer / orchestrator:
 *  - /health/live  : process is up (restart the container if this fails)
 *  - /health/ready : dependencies reachable (stop routing traffic here if this fails)
 */
@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicators: HealthIndicatorService,
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.database(), () => this.cache()]);
  }

  private async database() {
    const probe = this.indicators.check('database');
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return probe.up();
    } catch (err) {
      return probe.down({ message: (err as Error).message });
    }
  }

  private async cache() {
    const probe = this.indicators.check('redis');
    try {
      await this.redis.ping();
      return probe.up();
    } catch (err) {
      return probe.down({ message: (err as Error).message });
    }
  }
}
