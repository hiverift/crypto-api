import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as expressWinston from 'express-winston';
import winston from 'winston';
import { MetricsService } from './monitoring/metrics.service';


const helmet = require('helmet');
const cors = require('cors');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  app.use(helmet()); 
  app.use(cors());   

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

  const port = process.env.PORT || 3000;

  
  await app.listen(port);
  logger.log(`Server listening on ${port}`);
}
bootstrap();
