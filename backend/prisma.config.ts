import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 config. The schema is split per module under prisma/schema/*.prisma
 * (one file per bounded context, owned by the module owner — see docs/team.md).
 */
export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
