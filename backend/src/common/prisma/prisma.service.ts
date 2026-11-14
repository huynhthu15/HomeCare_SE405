import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { AppConfig } from '../config/app-config';

/**
 * Single PrismaClient per process (connection pool via the node-postgres driver adapter).
 * With N API replicas behind the load balancer the total pool is N x max — keep it under
 * Postgres max_connections (or put PgBouncer in front when scaling further).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: AppConfig) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL'), max: 10 }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

/** Client usable both inside and outside `prisma.$transaction(async (tx) => ...)`. */
export type DbClient = Omit<
  PrismaService,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$transaction'
  | '$extends'
  | 'onModuleInit'
  | 'onModuleDestroy'
>;
