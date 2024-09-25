import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { ButtonsService } from './buttons.service';
import { AdminScene } from './scene/admin.scene';
import { UserModule } from 'src/bot/user/user.module';
import { MandatorySubscribeModule } from '../mandatory-subscribe/mandatory-subscribe.module';

@Module({
  imports: [
    UserModule,
    // CreativesModule,
    MandatorySubscribeModule,
    // TypeOrmModule.forFeature([]),
  ],
  providers: [AdminService, ButtonsService, AdminScene],
})
export class AdminModule {}
