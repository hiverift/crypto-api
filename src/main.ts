import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as expressWinston from 'express-winston';
import winston from 'winston';
import { MetricsService } from './monitoring/metrics.service';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

const helmet = require('helmet');
const cors = require('cors');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
   dotenv.config();
  app.setGlobalPrefix('api');
  app.use(helmet()); 
    const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
    const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
    const isDev = nodeEnv !== 'production';

    console.log('Server Config:', { port, isDev, nodeEnv });
   const envOrigins = (process.env.ALLOWED_ORIGINS ?? '').trim();
    const defaultOrigins = isDev
      ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000']
      : ['https://cakistockmarket.com', 'https://www.cakistockmarket.com'];

    const allowedOrigins = envOrigins
      ? envOrigins.split(',').map((s) => s.trim()).filter(Boolean)
      : defaultOrigins;

    console.log('CORS allowed origins:', allowedOrigins);

    app.enableCors({
      origin: (origin, callback) => {
        // allow requests with no origin (curl, server-to-server). If you want to block them, change this.
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // not allowed
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
      ],
      maxAge: 86400,
    });  

  app.use(
    
    expressWinston.logger({
      winstonInstance: winston.createLogger({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transports: [new winston.transports.Console()],
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
      meta: true,
      msg: 'HTTP {{req.method}} {{req.url}}',
      expressFormat: true,
      colorize: false,
    }),
  );

  
  await app.listen(port);
  logger.log(`Server listening on ${port}`);

}
bootstrap();
