import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  const port = process.env.PORT ? Number(process.env.PORT) : 8001;
  const logger = new Logger();
  app.use('/uploads', express.static('uploads'));
  const allowedOrigins = ['https://tabrez1991.github.io','http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET, PUT, POST, DELETE, OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(port);
  logger.log(`Application is running on the port ${port}`);
}
bootstrap();
