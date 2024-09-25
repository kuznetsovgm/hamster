import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { I18nMiddleware } from './middleware/i18n.middleware';
import { ContextMiddleware } from './middleware/context.middleware';
import { BotComposer } from './bot.composer';
import { ResponseTimeInterceptor } from './interceptors/responce-time.interceptor';
import { AdminGuard } from './guards/is-admin.guard';
import { TelegrafExceptionFilter } from './filters/telegraf-exception.filter';
import { UserModule } from './user/user.module';
import { UserMiddleware } from './middleware/user.middleware';
import { MetadataScanner } from '@nestjs/core';
import { AutometricsModule } from 'src/autometrics/autometrics.module';
import { CatchErrorMiddleware } from './middleware/catchError.middleware';
import { DropOldUpdatesMiddleware } from './middleware/drop-old-updates.middleware';
import { redisIoProvider } from './providers/redis-io.provider';
import { AuthModule } from 'src/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { MandatorySubscribeModule } from './modules/mandatory-subscribe/mandatory-subscribe.module';
import { MainScene } from './scene/main.scene';
import { HamsterModule } from 'src/hamster/hamster.module';
import { DropUpdateByLangMiddleware } from './middleware/drop-by-lang.middleware';

@Module({
  imports: [
    UserModule,
    AutometricsModule,
    AuthModule,
    AdminModule,
    MandatorySubscribeModule,
    HamsterModule,
  ],
  providers: [
    BotComposer,
    BotService,
    I18nMiddleware,
    UserMiddleware,
    ContextMiddleware,
    ResponseTimeInterceptor,
    AdminGuard,
    TelegrafExceptionFilter,
    MetadataScanner,
    CatchErrorMiddleware,
    DropOldUpdatesMiddleware,
    DropUpdateByLangMiddleware,
    redisIoProvider,
    MainScene,
  ],
  exports: [
    I18nMiddleware,
    ContextMiddleware,
    UserMiddleware,
    CatchErrorMiddleware,
    DropOldUpdatesMiddleware,
    DropUpdateByLangMiddleware,
    MandatorySubscribeModule,
  ],
  controllers: [],
})
export class BotModule {}
