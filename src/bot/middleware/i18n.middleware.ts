import { Injectable } from '@nestjs/common';
import { I18nService, TranslateOptions } from 'nestjs-i18n';
import { Middleware } from 'telegraf';
import { IContext } from '../bot.interface';

@Injectable()
export class I18nMiddleware {
  constructor(private readonly i18n: I18nService) {}

  middleware(): Middleware<IContext> {
    return async (ctx, next) => {
      Object.defineProperty(ctx, 'i18n', {
        get: () => {
          return this.i18n;
        },
      });
      Object.defineProperty(ctx, 't', {
        value: (key: string, options: TranslateOptions = {}) => {
          return this.i18n.t(key, {
            lang: ctx.user?.lang ?? ctx.from.language_code,
            ...options,
          });
        },
      });

      return next();
    };
  }
}
