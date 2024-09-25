import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Hears, SceneEnter, Wizard, WizardStep } from 'nestjs-telegraf';
import { AdminService } from '../admin.service';
import { ButtonsService } from '../buttons.service';
import {
  MandatorySubscribeScene,
  MandatorySubscribeSceneInitialState,
} from '../mandatory-subscribe.interface';
import { EditMandatorySubscribeInitialState } from './edit.scene';
import { TelegramService } from '../telegram.service';
import { ConfigService } from '@nestjs/config';
import { ISceneContext, IWizardContext } from 'src/bot/bot.interface';
import { HearsTranslate } from 'src/bot/decorator/hears-translate.decorator';
import { IsAdmin } from 'src/bot/decorator/is-admin.decorator';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

export interface InitialState extends MandatorySubscribeSceneInitialState {}
export interface AddSponsorState extends InitialState {
  username?: string;
  isBot?: boolean;
  token?: string;
  link?: string;
  channelId?: number;
  title?: string;
  name?: string;
}
// export interface IDState extends InitialState {
//     id: number;
// }
// export interface ManagerState extends IDState {
//     username: string;
// }
// export interface LinkState extends ManagerState {
//     link: string;
// }
// export interface ChannelState extends LinkState {
//     channelId: number;
// }
// export interface NameState extends ChannelState {
//     title: string;
// }

export enum CreateSteps {
  ENTER,
  MANAGER,
  HANDLE_MANAGER,
  IS_BOT,
  HANDLE_IS_BOT,
  BOT_TOKEN,
  HANDLE_BOT_TOKEN,
  INVITE_LINK,
  HANDLE_INVITE_LINK,
  CHANNEL_ID,
  HANDLE_CHANNEL_ID,
  TITLE,
  HANDLE_TITLE,
  // NAME,
  // HANDLE_NAME,
  SAVE,
}

@Wizard(MandatorySubscribeScene.CREATE)
export class CreateScene {
  private readonly logger = new Logger(CreateScene.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly buttonsService: ButtonsService,
    private readonly i18n: I18nService,
  ) {}

  async enter(ctx: ISceneContext, initialState: InitialState) {
    await ctx.scene.enter(MandatorySubscribeScene.CREATE, initialState);
  }

  // @SceneEnter()
  @WizardStep(CreateSteps.ENTER)
  @IsAdmin()
  async sceneEnter(ctx: IWizardContext<AddSponsorState>) {
    await this.wizardNextStep(ctx, true);
  }

  @WizardStep(CreateSteps.MANAGER)
  async enterManager(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.enterManagerUsername', {
        lang: user.lang,
      }),
      {
        reply_markup: {
          keyboard: [
            [await this.buttonsService.keyboard.common.cancel(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
    await this.wizardNextStep(ctx, false);
  }
  @WizardStep(CreateSteps.HANDLE_MANAGER)
  @Hears(/^[^\/].+/gim)
  async handleManager(
    ctx: IWizardContext<
      AddSponsorState,
      Update.MessageUpdate<Message.TextMessage>
    >,
  ) {
    const res = await this.adminService.handleManagerUsername(ctx);
    if (!res) {
      await this.wizardBackStep(ctx, true);
      return;
    }
    ctx.scene.session.state.username = res;
    await this.wizardNextStep(ctx, true);
  }

  @WizardStep(CreateSteps.IS_BOT)
  async enterIsBot(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.enterIsBot', {
        lang: user.lang,
      }),
      {
        reply_markup: {
          keyboard: [
            [
              ctx.t('mandatory-subscribe.button.channel'),
              ctx.t('mandatory-subscribe.button.bot'),
            ],
            [await this.buttonsService.keyboard.common.cancel(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
    await this.wizardNextStep(ctx, false);
  }

  @WizardStep(CreateSteps.HANDLE_IS_BOT)
  @HearsTranslate('mandatory-subscribe.button.bot')
  async handleIsBot(ctx: IWizardContext<AddSponsorState>) {
    ctx.scene.session.state.isBot = true;
    await this.wizardSelectStep(ctx, CreateSteps.BOT_TOKEN);
  }

  @WizardStep(CreateSteps.HANDLE_IS_BOT)
  @HearsTranslate('mandatory-subscribe.button.channel')
  async handleIsChannel(ctx: IWizardContext<AddSponsorState>) {
    ctx.scene.session.state.isBot = false;
    await this.wizardSelectStep(ctx, CreateSteps.INVITE_LINK);
  }

  @WizardStep(CreateSteps.BOT_TOKEN)
  async enterBotToken(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.enterBotToken', {
        lang: user.lang,
      }),
      {
        reply_markup: {
          keyboard: [
            [await this.buttonsService.keyboard.common.cancel(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
    await this.wizardNextStep(ctx, false);
  }

  @WizardStep(CreateSteps.HANDLE_BOT_TOKEN)
  async handleBotToken(ctx: IWizardContext<AddSponsorState>) {
    const res = await this.adminService.handleToken(ctx);
    if (!res) {
      await this.wizardBackStep(ctx, true);
      return;
    }
    try {
      const me = await this.adminService.getMe(res);
      ctx.deleteMessage();
      ctx.scene.session.state.token = res;
      ctx.scene.session.state.channelId = me.id;
      ctx.scene.session.state.name = me.first_name;
      ctx.scene.session.state.link = `https://t.me/${me.username}?start=${ctx.botInfo.username}`;
      await this.wizardSelectStep(ctx, CreateSteps.TITLE, true);
    } catch (e) {
      await this.wizardBackStep(ctx, true);
      return;
    }
  }

  @WizardStep(CreateSteps.INVITE_LINK)
  async enterLink(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.enterLink', { lang: user.lang }),
      {
        reply_markup: {
          keyboard: [
            [await this.buttonsService.keyboard.common.cancel(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
    await this.wizardNextStep(ctx, false);
  }

  @WizardStep(CreateSteps.HANDLE_INVITE_LINK)
  async handleLink(ctx: IWizardContext<AddSponsorState>) {
    const res = await this.adminService.handleLink(ctx);
    if (!res) {
      await this.wizardBackStep(ctx, true);
      return;
    }
    ctx.scene.session.state.link = res;
    await this.wizardNextStep(ctx, true);
  }

  @WizardStep(CreateSteps.CHANNEL_ID)
  async enterChannelId(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.enterChannelId', {
        lang: user.lang,
      }),
      {
        reply_markup: {
          keyboard: [
            [await this.buttonsService.keyboard.common.cancel(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
    await this.wizardNextStep(ctx, false);
  }

  @WizardStep(CreateSteps.HANDLE_CHANNEL_ID)
  async handleChannelId(
    ctx: IWizardContext<AddSponsorState, Update.MessageUpdate<Message>>,
  ) {
    const chatId = await this.adminService.handleChannelId(ctx);
    if (!chatId) {
      await this.wizardBackStep(ctx, true);
      return;
    }
    const chat = await this.adminService.getChat(chatId);
    ctx.scene.session.state.name =
      chat.type === 'private' ? chat.first_name : chat.title;
    ctx.scene.session.state.channelId = chatId;
    await this.wizardNextStep(ctx, true);
  }

  @WizardStep(CreateSteps.TITLE)
  async enterTitle(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.enterTitle', {
        lang: user.lang,
      }),
      {
        reply_markup: {
          keyboard: [
            [await this.buttonsService.keyboard.common.skip(user.lang)],
            [await this.buttonsService.keyboard.common.cancel(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
    await this.wizardNextStep(ctx, false);
  }

  @WizardStep(CreateSteps.HANDLE_TITLE)
  async handleTitle(ctx: IWizardContext<AddSponsorState>) {
    const res = await this.adminService.handleTitle(ctx);
    if (!res) {
      await this.wizardBackStep(ctx, true);
      return;
    }
    ctx.scene.session.state.title = res;
    await this.wizardNextStep(ctx, true);
  }

  // @WizardStep(CreateSteps.NAME)
  // async enterName(ctx: IWizardContext<AddSponsorState>) {
  //     const { user } = ctx;
  //     await ctx.reply(this.i18n.t('mandatory-subscribe.message.enterName', {lang: user.lang}), {
  //         reply_markup: {
  //             keyboard: [
  //                 [
  //                     await this.buttonsService.keyboard.common.skip(user.lang),
  //                 ],
  //                 [
  //                     await this.buttonsService.keyboard.common.cancel(user.lang),
  //                 ],
  //             ],
  //             resize_keyboard: true,
  //         },
  //     });
  //     await this.wizardNextStep(ctx, false);
  // }

  // @WizardStep(CreateSteps.HANDLE_NAME)
  // async handleName(ctx: IWizardContext<AddSponsorState>) {
  //     const res = await this.adminService.handleName(ctx);
  //     if (!res) {
  //         await this.wizardBackStep(ctx, true);
  //         return;
  //     }
  //     ctx.scene.session.state.name = res;
  //     await this.wizardNextStep(ctx, true);
  // }

  @WizardStep(CreateSteps.SAVE)
  async save(ctx: IWizardContext<AddSponsorState>) {
    const state = ctx.scene.session.state;
    const res = await this.adminService.createSponsor({
      manager: state.username,
      chat_id: state.channelId,
      is_bot: state.isBot,
      token: state.token,
      link: state.link,
      title: state.title,
      name: state.name,
    });
    const initialState: EditMandatorySubscribeInitialState = {
      ...state,
      sponsorId: res.id,
    };
    await ctx.scene.enter(MandatorySubscribeScene.EDIT, initialState);
  }

  @HearsTranslate('mandatory-subscribe.button.cancel')
  async cancel(ctx: IWizardContext) {
    await ctx.scene.enter(
      ctx.scene.session.state.prev ?? MandatorySubscribeScene.ADMIN,
    );
  }

  @HearsTranslate('mandatory-subscribe.button.skip')
  async next(ctx: IWizardContext) {
    await this.wizardNextStep(ctx, true);
  }

  async wizardSelectStep(
    ctx: IWizardContext,
    step: CreateSteps,
    call: boolean = true,
  ) {
    ctx.wizard.selectStep(step);
    if (call) {
      const wizard = ctx.wizard as any;
      await wizard.steps[ctx.wizard.cursor](ctx);
    }
  }
  async wizardNextStep(ctx: IWizardContext, call: boolean = true) {
    ctx.wizard.next();
    if (call) {
      const wizard = ctx.wizard as any;
      await wizard.steps[ctx.wizard.cursor](ctx);
    }
  }
  async wizardBackStep(ctx: IWizardContext, call: boolean = true) {
    ctx.wizard.back();
    if (call) {
      const wizard = ctx.wizard as any;
      await wizard.steps[ctx.wizard.cursor](ctx);
    }
  }
}
