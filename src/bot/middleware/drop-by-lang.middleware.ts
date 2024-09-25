import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Middleware } from 'telegraf';
import Redis from 'ioredis';
import { IContext } from '../bot.interface';
import { InjectRedisIOProvider } from '../providers/redis-io.provider';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/app.interface';

@Injectable()
export class DropUpdateByLangMiddleware {
  private logger = new Logger(DropUpdateByLangMiddleware.name);
  private readonly langsToDrop: string[];
  constructor(
    @InjectRedisIOProvider() private readonly redis: Redis,
    private readonly configService: ConfigService<AppConfig>,
  ) {
    this.langsToDrop = JSON.parse(configService.get('LANGS_TO_DROP', '[]'));
  }

  middleware(): Middleware<IContext> {
    return async (ctx: IContext, next: () => Promise<any>) => {
      if (ctx.from && this.langsToDrop.includes(ctx.from.language_code)) {
        this.logger.warn(
          `drop update from bot id: ${ctx.botInfo.id}, user id: ${ctx.from.id}, lang: ${ctx.from?.language_code}`,
        );
        return;
      }
      return next();
    };
  }
}
