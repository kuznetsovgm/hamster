import { Module } from '@nestjs/common';
import { HamsterService } from './hamster.service';
import { Hamster } from 'src/entities/typeorm/hamster.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { redisIoProvider } from './providers/redis-io.provider';
import { HamsterController } from './hamster.controller';
import { UserModule } from 'src/bot/user/user.module';
import { WebshareProxyModule } from 'src/webshare-proxy/webshare-proxy.module';
import { AuthModule } from 'src/auth/auth.module';
import { HamsterLog } from 'src/entities/typeorm/hamsterLog.entity';
import { AdminController } from './admin.controller';
import { I18nController } from './i18n/i18n.controller';
import { MiniGameService } from './mini-game/mini-game.service';
import { MiniGameController } from './mini-game/mini-game.controller';
import { RidingExtrimePromoService } from './riding-extrime-promo/riding-extrime-promo.service';
import { PromoCode } from 'src/entities/typeorm/promoCode.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hamster, HamsterLog, PromoCode]),
    HttpModule.register({
      timeout: 30000,
    }),
    AuthModule,
    UserModule,
    WebshareProxyModule,
  ],
  providers: [
    HamsterService,
    MiniGameService,
    redisIoProvider,
    RidingExtrimePromoService,
  ],
  controllers: [
    HamsterController,
    AdminController,
    I18nController,
    MiniGameController,
  ],
  exports: [RidingExtrimePromoService],
})
export class HamsterModule {}
