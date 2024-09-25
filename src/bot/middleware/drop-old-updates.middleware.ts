import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Middleware } from 'telegraf';
import Redis from 'ioredis';
import { IContext } from '../bot.interface';
import { InjectRedisIOProvider } from '../providers/redis-io.provider';

const REDIS_KEY_PREFIX = 'last_update_id';
@Injectable()
export class DropOldUpdatesMiddleware {
  private logger = new Logger(DropOldUpdatesMiddleware.name);
  constructor(@InjectRedisIOProvider() private readonly redis: Redis) {}

  private getKey(botId: string | number) {
    return `${REDIS_KEY_PREFIX}:${botId}`;
  }
  async addUpdateId(botId: string | number, updateId: number) {
    this.redis.sadd(this.getKey(botId), updateId);
  }
  async isOldUpdate(botId: string | number, updateId: number) {
    return Boolean(await this.redis.sismember(this.getKey(botId), updateId));
  }

  middleware(): Middleware<IContext> {
    return async (ctx: IContext, next: () => Promise<any>) => {
      const isOldUpdate = await this.isOldUpdate(
        ctx.botInfo.id,
        ctx.update.update_id,
      );
      if (isOldUpdate) {
        this.logger.warn(
          `drop old update from bot id: ${ctx.botInfo.id}, update id: ${ctx.update.update_id}`,
        );
        return;
      }
      return next().then(() => {
        this.addUpdateId(ctx.botInfo.id, ctx.update.update_id);
      });
    };
  }
}
