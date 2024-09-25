import { Injectable } from '@nestjs/common';
import {
  AdminScene,
  InitialState as AdminSceneInitialState,
} from './scene/admin.scene';
import { SubscribeInitialState, SubscribeScene } from './scene/subscribe.scene';
import { SubscribeService } from './subscribe.service';
import { ISceneContext } from 'src/bot/bot.interface';
import { Update } from 'telegraf/typings/core/types/typegram';
import { User } from 'src/entities/typeorm/user.entity';

@Injectable()
export class MandatorySubscribeService {
  constructor(
    private readonly adminScene: AdminScene,
    private readonly subscribeScene: SubscribeScene,
    private readonly subscribeService: SubscribeService,
  ) {}

  async enterAdmin(ctx: ISceneContext, initialState: AdminSceneInitialState) {
    await this.adminScene.enter(ctx, initialState);
  }

  async enterUser(
    ctx: ISceneContext<any, Update>,
    initialState: SubscribeInitialState,
  ) {
    await this.subscribeScene.enter(ctx, initialState);
  }

  async check(user: User) {
    return await this.subscribeService.checkUser(user);
  }
}
