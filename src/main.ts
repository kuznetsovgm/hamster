import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './app.interface';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule, { logger: new Logger() });
  app.enableShutdownHooks();
  const configService = app.get(ConfigService<AppConfig>);
  const origins = JSON.parse(configService.getOrThrow('CORS_ORIGIN'));
  app.enableCors({
    origin: origins,
  });
  app.use(
    helmet({
      xFrameOptions: false,
    }),
  );
  const port = configService.get('APP_PORT', 3000, { infer: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(port, () => logger.log(`Listen port: ${port}`));
}
bootstrap();
