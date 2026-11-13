import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { Env } from '../config/env.schema';

const QUIET_PATHS = ['/health/live', '/health/ready', '/metrics'];

/**
 * Structured JSON logs (pino). Every line carries the request id and the instance hostname,
 * so logs from several API replicas behind the load balancer can be correlated.
 * Secrets (Authorization header, cookies) are redacted.
 */
export const LoggerModule = PinoLoggerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) => {
    const pretty = config.get('NODE_ENV', { infer: true }) === 'development';
    return {
      pinoHttp: {
        level: config.get('LOG_LEVEL', { infer: true }),
        base: { role: config.get('APP_ROLE', { infer: true }), instance: hostname() },
        genReqId: (req, res) => {
          const incoming = req.headers['x-request-id'];
          const id =
            typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming)
              ? incoming
              : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            '*.password',
            '*.refreshToken',
          ],
          censor: '[redacted]',
        },
        autoLogging: { ignore: (req) => QUIET_PATHS.includes(req.url ?? '') },
        transport: pretty
          ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } }
          : undefined,
      },
    };
  },
});
