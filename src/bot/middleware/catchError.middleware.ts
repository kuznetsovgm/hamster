import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Middleware, TelegramError } from 'telegraf';
import { IContext } from '../bot.interface';
import {
  Chat,
  Opts,
  Telegram,
  Telegram as TelegramApi,
  User,
} from 'telegraf/typings/core/types/typegram';
import ApiClient from 'telegraf/typings/core/network/client';
import { sleep } from 'src/common/helpers/app.helpers';

@Injectable()
export class CatchErrorMiddleware {
  private logger = new Logger(CatchErrorMiddleware.name);
  private botChatState: Record<
    string,
    {
      rateLimitedBefore?: number;
    }
  > = {};
  constructor() {}

  middleware(): Middleware<IContext> {
    return async (ctx: IContext, next: () => Promise<any>) => {
      const oldCallApi = ctx.telegram.callApi;
      ctx.telegram.callApi = (...args) =>
        this.callApiWithErrorCatch(ctx, oldCallApi, ...args);
      return next();
    };
  }

  private callApiWithErrorCatch = async <M extends keyof Telegram>(
    ctx: IContext,
    oldCallApi: IContext['telegram']['callApi'],
    method: M,
    payload: Opts<M>,
    options: ApiClient.CallApiOptions,
  ): Promise<ReturnType<TelegramApi[M]>> => {
    const delay =
      (this.botChatState[this.getStateKey(ctx.botInfo.id, ctx.chat.id, method)]
        ?.rateLimitedBefore ?? 0) - Date.now();
    if (delay > 0) {
      await sleep(delay);
    }
    let counter = 0;
    return oldCallApi
      .call(ctx.telegram, method, payload, options)
      .catch(async (err: unknown) => {
        if (!(err instanceof TelegramError)) {
          throw err;
        }
        if (err.code >= 500 && counter < 5) {
          counter++;
          const delay = 3000;
          this.logger.debug(
            `api call bot id: ${ctx.botInfo.id}, chat id: ${ctx.chat.id}, method: ${method} throw error with code ${err.code}. retrying after ${delay}ms.`,
          );
          await sleep(delay);
          return await this.callApiWithErrorCatch(
            ctx,
            oldCallApi,
            method,
            payload,
            options,
          );
        } else if (err.code === 429) {
          const delay = (+err.message.match(/\d+$/) || 1) * 1000;
          const rateLimiterKey = this.getStateKey(
            ctx.botInfo.id,
            ctx.chat.id,
            method,
          );
          this.botChatState[rateLimiterKey] = {
            rateLimitedBefore: Math.max(
              Date.now() + delay,
              +this.botChatState[rateLimiterKey],
            ),
          };
          this.logger.debug(
            `api call bot id: ${ctx.botInfo.id}, chat id: ${ctx.chat.id}, method: ${method} throw rate limit error. retry after ${delay}ms.`,
          );
          await sleep(delay);
          return await this.callApiWithErrorCatch(
            ctx,
            oldCallApi,
            method,
            payload,
            options,
          );
        } else {
          this.logger.debug(
            `api call bot id: ${ctx.botInfo.id}, chat id: ${ctx.chat.id}, method: ${method} throw error with code ${err.code}.`,
          );
          throw err;
        }
      });
  };

  private getStateKey(
    botId: User['id'],
    chatId: Chat['id'],
    method: keyof TelegramApi,
  ) {
    return `${botId}:${chatId}:${method}`;
  }
}
