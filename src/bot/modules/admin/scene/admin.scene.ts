import { Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  Scene,
  InjectBot,
  Command,
  SceneLeave,
  SceneEnter,
} from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { BotCommand } from 'telegraf/typings/core/types/typegram';
import { AdminScenes } from '../admin.interface';
import { AdminService } from '../admin.service';
import { ButtonsService } from '../buttons.service';
import { UserService } from 'src/bot/user/user.service';
import { MandatorySubscribeService } from '../../mandatory-subscribe/mandatory-subscribe.service';
import { ISceneContext, BotScene, IContext } from 'src/bot/bot.interface';
import { IsAdmin } from 'src/bot/decorator/is-admin.decorator';
import { HearsTranslate } from 'src/bot/decorator/hears-translate.decorator';

@Scene(AdminScenes.ADMIN)
export class AdminScene {
  private readonly logger = new Logger(AdminScene.name);
  constructor(
    private readonly adminService: AdminService,
    private readonly buttonsService: ButtonsService,
    private readonly userService: UserService,
    // private readonly creativesService: CreativesService,
    private readonly mandatorySubscribeService: MandatorySubscribeService,
    private readonly i18n: I18nService,
    @InjectBot() private bot: Telegraf<Context>,
  ) {}

  // async enter(ctx: ISceneContext, initialState: InitialState) {
  //     await ctx.scene.enter(MandatorySubscribeScene.ADMIN, initialState);
  // }

  @Command('exit')
  @HearsTranslate('admin.button.back')
  async exitAdmin(ctx: ISceneContext) {
    await ctx.scene.enter(BotScene.MAIN);
  }

  @SceneLeave()
  async sceneLeave(ctx: ISceneContext) {}

  @SceneEnter()
  @IsAdmin()
  async enterAdmin(ctx: ISceneContext) {
    const user = ctx.user;
    const commands: BotCommand[] = [];
    commands.push({
      command: 'exit',
      description: this.i18n.t('admin.commandDescription.exitAdmin', {
        lang: user.lang,
      }),
    });

    await this.bot.telegram.setMyCommands(commands, {
      scope: {
        type: 'chat',
        chat_id: user.id,
      },
    });

    await ctx.reply(
      this.i18n.t('admin.message.welcomeAdmin', { lang: user.lang }),
      {
        parse_mode: 'Markdown',
        link_preview_options: {
          is_disabled: true,
        },
        reply_markup: {
          keyboard: [
            [
              this.buttonsService.keyboard.admin.statistic(user.lang),
              this.buttonsService.keyboard.admin.exportUsers(user.lang),
            ],
            [
              this.buttonsService.keyboard.admin.mailing(user.lang),
              this.buttonsService.keyboard.admin.creatives(user.lang),
            ],
            [this.buttonsService.keyboard.admin.sponsors(user.lang)],
            [this.buttonsService.keyboard.common.back(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
  }

  // @HearsTranslate(/Статистика/)
  // @Command('status')
  // @IsAdmin()
  // async status(ctx: IContext) {
  //   console.time('AdminScene.status');
  //   const { user } = ctx;
  //   // const userSource = await this.userService.getRecentSources();

  //   await ctx.reply(
  //     this.i18n.t('admin.message.usersStatus', {
  //       lang: user.lang,
  //       args: {
  //         // userSource: usersStatus.userSource.reduce(
  //         //   (prev, cur) =>
  //         //     (prev += `\n<code>${cur.start_deep_link}</code> - ${cur.count} (+${cur.recently_count})`),
  //         //   '',
  //         // ),
  //       },
  //     }),
  //     { parse_mode: 'HTML' },
  //   );

  //   console.timeEnd('AdminScene.status');
  // }

  @HearsTranslate('admin.button.usersList')
  @IsAdmin()
  async usersList(ctx: IContext) {
    const exportBuffer = await this.adminService.exportUsersFile(ctx);
    await ctx.replyWithDocument({
      source: exportBuffer,
      filename: 'users.txt',
    });
  }

  // @HearsTranslate(/рассылки/i)
  // @IsAdmin()
  // async mailing(ctx: ISceneContext) {
  //   await ctx.scene.enter('mailing');
  // }

  // @Hears(/креатив/i)
  // @IsAdmin()
  // async creatives(ctx: ISceneContext) {
  //   await this.creativesService.enter(ctx, {
  //     prev: ctx.scene.current.id,
  //   });
  // }

  @HearsTranslate('admin.button.sponsors')
  @IsAdmin()
  async sponsors(ctx: ISceneContext) {
    await this.mandatorySubscribeService.enterAdmin(ctx, {
      prev: ctx.scene.current.id,
    });
  }

  // @Command('dl')
  // @Hears(/.*/i)
  // @IsAdmin()
  // async deepLink(ctx: IContext) {
  //   if (!('text' in ctx.message)) {
  //     return;
  //   }
  //   const dl = ctx.message.text
  //     .replace('/dl', '')
  //     .trim()
  //     .split('start=')
  //     .at(-1);
  //   if (dl.length === 0) {
  //     await ctx.reply(`🤦‍♂️`);
  //     return;
  //   }
  //   const status = await this.userService.deepLinkStatus(dl);

  //   await ctx.reply(
  //     `<code>${dl}</code>:\nЗа всё время пришло: ${status.countFull} (новых: ${status.countNew})\nЗа ${status.userSourceDays} дней: ${status.recent}`,
  //     {
  //       parse_mode: 'HTML',
  //     },
  //   );
  //   await ctx.reply(
  //     `Прошли ОП:\n${status.op?.map((op) => `${op.is_active ? '🟢' : '⚫️'} <a href='${op.link}'>${op.name}</a> - ${op.count}`).join('\n') ?? '0️⃣'}`,
  //     {
  //       parse_mode: 'HTML',
  // link_preview_options: {
  //     is_disabled: true
  // },
  //     },
  //   );
  // }
}
