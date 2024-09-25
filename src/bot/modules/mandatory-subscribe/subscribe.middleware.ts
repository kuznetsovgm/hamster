import { Injectable } from '@nestjs/common';
import { Middleware } from 'telegraf';
import { MandatorySubscribeScene } from './mandatory-subscribe.interface';
import { SubscribeInitialState } from './scene/subscribe.scene';
import { SubscribeService } from './subscribe.service';
import { IContext, ISceneContext } from 'src/bot/bot.interface';
import { UserRole } from 'src/bot/user/user.interface';

@Injectable()
export class SubscribeMiddleware {
  constructor(private readonly subscribeService: SubscribeService) {}

  middleware(): Middleware<IContext> {
    return async (ctx: ISceneContext, next: () => Promise<void>) => {
      const { user, session } = ctx;
      const message = ctx.message;
      const state: SubscribeInitialState = {
        prev: session?.__scenes?.current,
      };
      if (!!message && 'text' in message && message.text.match(/\/start.*/i)) {
        return next();
      }
      if (!user || [UserRole.ADMIN].includes(user.role)) {
        return next();
      }
      const check = await this.subscribeService.checkUser(user);
      if (
        !check &&
        ctx.session?.__scenes?.current !== MandatorySubscribeScene.SUBSCRIBE
      ) {
        ctx.session.__scenes = {
          current: MandatorySubscribeScene.SUBSCRIBE,
          state,
        };
        if (ctx.updateType !== 'inline_query') {
          const res = await this.subscribeService.sendSponsorMessage(ctx);
          if (state?.messageId) {
            await ctx.deleteMessage().catch((e) => {});
          }
          state.messageId = res.message_id;
        } else {
          //   await this.subscribeService.answerInlineQuery(ctx);
        }
        return;
      }
      return next();
    };
  }
}
