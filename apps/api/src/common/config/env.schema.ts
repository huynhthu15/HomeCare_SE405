import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

/**
 * Every environment variable the API reads. The process refuses to start when one is invalid,
 * so misconfiguration fails at deploy time instead of at the first request.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    /** Same image, two roles: `api` serves HTTP/WebSocket behind the load balancer, `worker` runs jobs. */
    APP_ROLE: z.enum(['api', 'worker']).default('api'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),
    /** Number of reverse-proxy hops to trust for X-Forwarded-For (1 behind Nginx). */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(14),
    COOKIE_SECURE: bool.default(false),

    /** Disables rate limiting (e2e tests only). Ignored in production. */
    THROTTLE_DISABLED: bool.default(false),
    /** Worker: how often the outbox relay polls, in ms */
    OUTBOX_POLL_MS: z.coerce.number().int().positive().default(1000),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (env.JWT_ACCESS_SECRET.startsWith('dev-')) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_ACCESS_SECRET'],
          message: 'Development JWT secret must not be used in production',
        });
      }
      if (!env.COOKIE_SECURE) {
        ctx.addIssue({
          code: 'custom',
          path: ['COOKIE_SECURE'],
          message: 'COOKIE_SECURE must be true in production',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`);
  }
  return parsed.data;
}
