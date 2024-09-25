import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRedisOmConfig } from './common/config/redis-om.config';
import { RedisOmModule } from 'nestjs-redis-om';
import { validate } from './common/config/env.validation';
import * as path from 'path';
import { AutometricsModule } from './autometrics/autometrics.module';
import { getTelegrafConfig } from './common/config/telegraf.config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/bot.module';
import { I18nMiddleware } from './bot/middleware/i18n.middleware';
import { UserMiddleware } from './bot/middleware/user.middleware';
import {
  I18nModule,
  I18nJsonLoader,
  QueryResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import { TypeOrmModuleAsyncOptions, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import dbConfiguration, {
  DATABASE_CONFIG_TOKEN,
} from './common/config/db.config';
import { CatchErrorMiddleware } from './bot/middleware/catchError.middleware';
import { DropOldUpdatesMiddleware } from './bot/middleware/drop-old-updates.middleware';
import { HamsterModule } from './hamster/hamster.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WebshareProxyModule } from './webshare-proxy/webshare-proxy.module';
import { AuthModule } from './auth/auth.module';
import { SubscribeMiddleware } from './bot/modules/mandatory-subscribe/subscribe.middleware';
import { DropUpdateByLangMiddleware } from './bot/middleware/drop-by-lang.middleware';

const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [
    ConfigModule.forRoot({
      load: [dbConfiguration],
    }),
  ],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) =>
    configService.getOrThrow(DATABASE_CONFIG_TOKEN),
  dataSourceFactory: async (options: DataSourceOptions) =>
    new DataSource(options).initialize(),
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [path.resolve('.env')],
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validationOptions: {},
      validate,
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    AutometricsModule,
    RedisOmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getRedisOmConfig,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.resolve('i18n/'),
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
      logging: false,
    }),
    ScheduleModule.forRoot(),
    HamsterModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, BotModule],
      inject: [
        ConfigService,
        UserMiddleware,
        I18nMiddleware,
        CatchErrorMiddleware,
        DropOldUpdatesMiddleware,
        SubscribeMiddleware,
        DropUpdateByLangMiddleware,
      ],
      useFactory: getTelegrafConfig,
    }),
    AuthModule,
    BotModule,
    WebshareProxyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
