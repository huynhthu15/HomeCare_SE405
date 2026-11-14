import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { AppConfig } from './common/config/app-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app);

  const config = app.get(AppConfig);
  await app.listen(config.get('PORT'), '0.0.0.0');
  app.get(Logger).log(`HomeCare API listening on :${config.get('PORT')} (docs: /api/docs)`);
}

void bootstrap();
