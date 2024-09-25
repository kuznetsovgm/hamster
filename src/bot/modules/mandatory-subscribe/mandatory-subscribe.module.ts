import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { ButtonsService } from './buttons.service';
import { Sponsor } from './entity/sponsor.entity';
import { Subscribe } from './entity/subscribe.entity';
import { MandatorySubscribeService } from './mandatory-subscribe.service';
import { AdminScene } from './scene/admin.scene';
import { CreateScene } from './scene/create.scene';
import { EditScene } from './scene/edit.scene';
import { SubscribeScene } from './scene/subscribe.scene';
import { SponsorService } from './sponsor.service';
import { SubscribeMiddleware } from './subscribe.middleware';
import { SubscribeService } from './subscribe.service';
import { TelegramService } from './telegram.service';
import { EditLinkScene } from './scene/edit-link.scene';
import { EditLangsScene } from './scene/edit-langs.scene';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Sponsor, Subscribe])],
  providers: [
    TelegramService,
    MandatorySubscribeService,
    ButtonsService,
    AdminScene,
    SubscribeScene,
    CreateScene,
    EditScene,
    EditLinkScene,
    EditLangsScene,
    AdminService,
    SponsorService,
    SubscribeService,
    SubscribeMiddleware,
  ],
  exports: [SubscribeMiddleware, MandatorySubscribeService],
})
export class MandatorySubscribeModule {}
