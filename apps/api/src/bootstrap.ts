import { hostname } from 'node:os';
import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppConfig } from './common/config/app-config';
import { httpMetricsMiddleware } from './common/metrics/metrics';

export const API_PREFIX = 'api/v1';

/**
 * HTTP pipeline shared by main.ts and the e2e tests, so tests exercise the real configuration.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfig);
  const instance = hostname();

  // Behind Nginx: trust X-Forwarded-For so req.ip / rate limits use the real client IP
  app.set('trust proxy', config.get('TRUST_PROXY'));
  app.disable('x-powered-by');
  // Helmet defaults everywhere, including its Content-Security-Policy. Swagger UI works under the
  // default CSP because @nestjs/swagger serves its init script as a file, not an inline script.
  // Only `upgrade-insecure-requests` waits for production: dev serves Swagger over plain http.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { upgradeInsecureRequests: config.isProduction ? [] : null },
      },
    }),
  );
  app.use(cookieParser());
  app.use(httpMetricsMiddleware);
  // Lets you SEE the load balancer at work: each response names the replica that served it
  app.use((_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    res.setHeader('x-served-by', instance);
    next();
  });

  app.enableCors({
    origin: config.get('CORS_ORIGINS'),
    credentials: true,
    exposedHeaders: ['x-request-id', 'x-served-by'],
  });

  app.setGlobalPrefix(API_PREFIX, {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
    ],
  });
  app.enableShutdownHooks();

  if (!config.isProduction) {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('HomeCare API')
        .setDescription('Modular monolith — see docs/architecture/system-design.md')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(doc));
  }
}
