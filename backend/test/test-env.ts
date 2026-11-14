import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Points the process at the test database. Uses DATABASE_URL_TEST when set (CI),
 * otherwise swaps the database name of DATABASE_URL: .../homecare -> .../homecare_test
 */
export function applyTestEnv(): void {
  loadDotenv({ path: resolve(__dirname, '../.env'), quiet: true });

  const devUrl =
    process.env.DATABASE_URL ?? 'postgresql://homecare:homecare@localhost:5432/homecare';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL_TEST ?? devUrl.replace(/\/homecare(\?|$)/, '/homecare_test$1');

  process.env.NODE_ENV = 'test';
  process.env.THROTTLE_DISABLED = 'true';
  process.env.LOG_LEVEL = 'error';
  process.env.REDIS_URL ??= 'redis://localhost:6379';
  process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-that-is-long-enough-123';
}
