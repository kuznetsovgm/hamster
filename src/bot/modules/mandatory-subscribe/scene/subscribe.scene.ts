import { Logger } from '@nestjs/common';
import { Hears, On, Scene, SceneEnter } from 'nestjs-telegraf';
import {
  MandatorySubscribeActions,
  MandatorySubscribeScene,
} from '../mandatory-subscribe.interface';
import { SubscribeService } from '../subscribe.service';
import { ISceneStateBase, ISceneContext } from 'src/bot/bot.interface';
import { ActionData } from 'src/bot/decorator/callbackDataAction.decorator';
import { TelegramService } from '../telegram.service';

export interface SubscribeInitialState extends ISceneStateBase {
  messageId?: number;
}

@Scene(MandatorySubscribeScene.SUBSCRIBE)
export class SubscribeScene {
  private readonly logger = new Logger(SubscribeScene.name);

  constructor(
    private readonly subscribeService: SubscribeService,
    private readonly telegramService: TelegramService,
  ) {}

  async enter(ctx: ISceneContext, initialState: SubscribeInitialState) {
    await ctx.scene.enter(MandatorySubscribeScene.SUBSCRIBE, initialState);
  }

  @SceneEnter()
  async sceneEnter(ctx: ISceneContext<SubscribeInitialState>) {
    const { user } = ctx;
    const state = ctx.scene.session.state;
    const res = await this.subscribeService.sendSponsorMessage(ctx);
    if (!res) {
      this.exit(ctx);
      return;
    }
    if (state?.messageId) {
      await ctx.deleteMessage(state.messageId).catch((e) => {});
    }
    state.messageId = res?.message_id;
  }

  @ActionData<MandatorySubscribeActions>('check_subscribe')
  async check(ctx: ISceneContext<SubscribeInitialState>) {
    const check = await this.subscribeService.checkUser(ctx.user);
    if (!check) {
      await ctx.answerCbQuery('👮⛔️');
      await ctx.scene.reenter();
      return;
    }
    const state = ctx.scene.session.state;
    if (state?.messageId) {
      await ctx.deleteMessage(state.messageId).catch((e) => {});
    }

    await ctx.answerCbQuery('👍');
    // await ctx.scene.enter('main');
    this.exit(ctx);
  }

  @Hears(/^(?!(\/start)).*/i)
  @On([
    'poll',
    'animation',
    'document',
    'audio',
    'contact',
    'dice',
    'game',
    'location',
    'photo',
    'sticker',
    'venue',
    'video',
    'video_note',
    'voice',
  ])
  async reenter(ctx: ISceneContext) {
    await ctx.scene.reenter();
  }

  @On(['callback_query'])
  async reenterCb(ctx: ISceneContext) {
    await ctx.answerCbQuery('👮⛔️');
    await ctx.scene.reenter();
  }

  //   @On(['inline_query'])
  //   async handleInline(ctx: ISceneContext) {
  //     await this.subscribeService.answerInlineQuery(ctx);
  //   }

  exit(ctx: ISceneContext) {
    return ctx.scene.enter('main');
  }
}
