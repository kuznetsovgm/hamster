import {
  Action,
  Command,
  Composer,
  Help,
  InjectBot,
  On,
  Start,
} from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { Logger, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BotCommand as BotCommandEnum,
  BotScene,
  GroupScene,
  IContext,
  ISceneContext,
} from './bot.interface';
import {
  COMMANDS_DESCRIPTION,
  SITE_LOGIN_PAYLOAD_STARTS,
} from './bot.constants';
import { BotService } from './bot.service';
import { AdminGuard } from './guards/is-admin.guard';
import { ResponseTimeInterceptor } from './interceptors/responce-time.interceptor';
import { TelegrafExceptionFilter } from './filters/telegraf-exception.filter';
import {
  CallbackQuery,
  Message,
  Update,
  Update as UpdateType,
} from 'telegraf/typings/core/types/typegram';
import { MyChatMember } from './decorator/my-chat-member.decorator';
import { UserRole } from './user/user.interface';
import { AutometricsLegacy } from '@autometrics/autometrics';
import { UserService } from './user/user.service';
import { CommandContextExtn } from 'telegraf/typings/telegram-types';
import { AuthService } from 'src/auth/auth.service';
import { IsAdmin } from './decorator/is-admin.decorator';
import { AdminScenes } from './modules/admin/admin.interface';
import { MandatorySubscribeService } from './modules/mandatory-subscribe/mandatory-subscribe.service';

@Composer()
@UseInterceptors(ResponseTimeInterceptor)
@UseFilters(TelegrafExceptionFilter)
// @AutometricsLegacy()
export class BotComposer {
  private logger = new Logger(BotComposer.name);
  constructor(
    private readonly botService: BotService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly subscribeService: MandatorySubscribeService,
  ) {}

  @Start()
  @AutometricsLegacy()
  async startCommand(
    ctx: ISceneContext<unknown, UpdateType.MessageUpdate<Message.TextMessage>> &
      CommandContextExtn,
  ) {
    await this.botService.setCommands(ctx);
    if (!this.botService.isDirectChat(ctx)) {
      return;
    }
    const payload = ctx.payload;
    if (payload && payload.startsWith(SITE_LOGIN_PAYLOAD_STARTS)) {
      await this.authService
        .signIn({ loginToken: payload }, ctx.user)
        .then(() => ctx.reply(ctx.t('bot.message.successLogin')))
        .catch((e) => {
          ctx.reply(ctx.t('bot.message.startBotFromSiteLink'));
        });
      return;
    }

    const user = ctx.user;
    const isStaff = [UserRole.ADMIN].includes(user.role);
    if (!isStaff) {
      const check = await this.subscribeService.check(user);
      if (!check) {
        return this.subscribeService.enterUser(ctx as any, {});
      }
    }
    ctx.scene.enter(BotScene.MAIN);
  }

  @Help()
  @UseGuards(AdminGuard)
  async helpCommand(ctx: ISceneContext) {
    await this.botService.setCommands(ctx);
    const text = Object.keys(COMMANDS_DESCRIPTION)
      .map(
        (command: BotCommandEnum) =>
          COMMANDS_DESCRIPTION[command].fullDescription,
      )
      .join(`\n\n`);
    await ctx.reply(text, {
      parse_mode: 'HTML',
      link_preview_options: {
        is_disabled: true,
      },
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }

  @Command('admin')
  @IsAdmin()
  async admin(ctx: ISceneContext) {
    await ctx.scene.enter(AdminScenes.ADMIN);
  }

  @MyChatMember(['kicked', 'left', 'restricted'])
  async onMyChatMemberLeft(ctx: IContext<UpdateType.MyChatMemberUpdate>) {
    await this.userService.deactivate(ctx.user);
  }
}
