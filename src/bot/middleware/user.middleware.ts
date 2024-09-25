import { Injectable } from '@nestjs/common';
import { Context, Middleware } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { SceneContext } from 'telegraf/typings/scenes';
import { getUserId } from '../bot.helpers';
import { UserService } from '../user/user.service';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { User } from 'src/entities/typeorm/user.entity';
import { CommandContextExtn } from 'telegraf/typings/telegram-types';

@Injectable()
export class UserMiddleware {
  constructor(private readonly usersService: UserService) {}

  getLang(from: Context['from']): string {
    return from.language_code === 'ru' ? 'ru' : 'en';
  }

  async getUser(ctx: Context): Promise<User | null> {
    const id = getUserId(ctx);
    if (id === null) {
      return null;
    }

    return await this.usersService.findOne(id);
  }

  getDeepLink(ctx: Context): string | null {
    const message = ctx.message as Message.TextMessage;
    return message?.text?.replace(/^\S*\s*/s, '') ?? null;
  }

  async initUser(
    ctx: Context<Update> & CommandContextExtn,
  ): Promise<User | null> {
    let user = await this.getUser(ctx);
    const message = ctx.message as Message.TextMessage;
    if (!user) {
      user = await this.createUser(ctx);
    } else if (!user.started && message && message.text.match(/^\/start/i)) {
      user = await this.startUser(ctx as Context<Update.MessageUpdate>);
    }
    return user;
  }

  async createUser(ctx: Context & CommandContextExtn): Promise<User | null> {
    const { from } = ctx;
    if (!from) {
      return null;
    }
    const message = ctx.message as Message.TextMessage;
    return await this.usersService.create({
      id: from.id,
      first_name: from.first_name,
      last_name: from.last_name,
      username: from.username,
      last_message_id: message?.message_id,
      started: !!message,
      lang: this.getLang(ctx.from),
      start_deep_link: this.getDeepLink(ctx),
    });
  }

  async startUser(ctx: Context<Update.MessageUpdate>): Promise<User | null> {
    const { from } = ctx;
    const message = ctx.message as Message.TextMessage;
    const update: UpdateUserDto = {
      id: from.id,
      first_name: from.first_name,
      last_name: from.last_name,
      username: from.username,
      started: true,
      lang: this.getLang(ctx.from),
    };
    return await this.usersService.update(update);
  }

  userMiddleware(): Middleware<SceneContext & CommandContextExtn> {
    return async (ctx, next) => {
      const user = await this.initUser(ctx);

      if (!user) {
        return;
      }

      user.lang = this.getLang(ctx.from);

      if (ctx.chat) {
        // if (!this.botService.isDirectChat(ctx)) {
        //     const group = await this.groupService.get(BigInt(ctx.chat.id));
        //     if (group) {
        //       Object.defineProperty(ctx, 'group', {
        //         get: function () {
        //           return group;
        //         },
        //       });
        //     }
        // }
      }

      Object.defineProperty(ctx, 'user', {
        get: function () {
          return user;
        },
      });

      return next().then(() => {
        return this.usersService.update({
          id: user.id,
          lang: this.getLang(ctx.from),
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name,
          username: ctx.from.username,
        });
      });
    };
  }
}
