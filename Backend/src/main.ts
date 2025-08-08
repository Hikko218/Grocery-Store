import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set('trust proxy', 1);

  // Enable logger only in development
  if (process.env.NODE_ENV === 'development') {
    Logger.log('Logger enabled in development mode');
  } else {
    // Disable logger in production
    Logger.overrideLogger(false); // Disable logger in production
  }

  app.use(cookieParser());
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: false,
  });

  app.use(
    '/auth',
    rateLimit({
      windowMs: 60 * 1000, //
      max: 60,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
