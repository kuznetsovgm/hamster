import { Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Action, Hears, Scene, SceneEnter } from 'nestjs-telegraf';
import {
  CallbackQuery,
  InlineKeyboardButton,
  Message,
  Update,
} from 'telegraf/typings/core/types/typegram';
import { AdminService } from '../admin.service';
import { ButtonsService } from '../buttons.service';
import {
  MandatorySubscribeScene,
  MandatorySubscribeSceneInitialState,
} from '../mandatory-subscribe.interface';
import { SponsorService } from '../sponsor.service';
import { SubscribeService } from '../subscribe.service';
import { CreateScene } from './create.scene';
import { EditScene } from './edit.scene';
import { ISceneContext } from 'src/bot/bot.interface';
import { IsAdmin } from 'src/bot/decorator/is-admin.decorator';
import { AdminScenes } from '../../admin/admin.interface';
import { HearsTranslate } from 'src/bot/decorator/hears-translate.decorator';
import { NarrowedContext } from 'telegraf';

export interface InitialState extends MandatorySubscribeSceneInitialState {}

type CallbackAction = 'view' | 'back' | 'next' | 'close';
interface ISubscriptionAdminCallbackDataBase {
  action: CallbackAction;
  isActive: boolean;
}
interface ISubscriptionAdminCallbackDataView
  extends ISubscriptionAdminCallbackDataBase {
  action: 'view';
  sponsorId: number;
}
interface ISubscriptionAdminCallbackDataCtrl
  extends ISubscriptionAdminCallbackDataBase {
  action: 'back' | 'next';
  page: number;
}
interface ISubscriptionAdminCallbackDataClose {
  action: 'close';
}
type ISubscriptionAdminCallbackData =
  | ISubscriptionAdminCallbackDataView
  | ISubscriptionAdminCallbackDataCtrl
  | ISubscriptionAdminCallbackDataClose;

function getTextByStatus(active: boolean): string {
  return active ? 'активные' : 'выключен';
}
function getStatusByText(
  ctx: ISceneContext<InitialState, Update.MessageUpdate<Message.TextMessage>>,
): boolean {
  return ctx.t('mandatory-subscribe.button.active') === ctx.text;
}

@Scene(MandatorySubscribeScene.ADMIN)
export class AdminScene {
  private readonly logger = new Logger(AdminScene.name);

  constructor(
    private readonly subscribeService: SubscribeService,
    private readonly sponsorService: SponsorService,
    private readonly adminService: AdminService,
    private readonly buttonsService: ButtonsService,
    private readonly createScene: CreateScene,
    private readonly editScene: EditScene,
    private readonly i18n: I18nService,
  ) {}

  async enter(ctx: ISceneContext, initialState: InitialState) {
    await ctx.scene.enter(MandatorySubscribeScene.ADMIN, initialState);
  }

  @SceneEnter()
  @IsAdmin()
  async sceneEnter(ctx: ISceneContext<InitialState>) {
    const { user } = ctx;
    const msg = await this.subscribeService.sendSponsorMessage(ctx, true);
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.adminEnter', {
        lang: user.lang,
        args: {
          subCheckerBot: await this.adminService.getBotUsername(),
        },
      }),
      {
        reply_parameters: msg && {
          message_id: msg?.message_id,
          allow_sending_without_reply: true,
        },
        link_preview_options: {
          is_disabled: true,
        },
        reply_markup: {
          keyboard: [
            [await this.buttonsService.keyboard.admin.new(user.lang)],
            [
              await this.buttonsService.keyboard.admin.active(user.lang),
              await this.buttonsService.keyboard.admin.disabled(user.lang),
            ],
            [await this.buttonsService.keyboard.common.back(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
  }

  @HearsTranslate([
    'mandatory-subscribe.button.active',
    'mandatory-subscribe.button.disabled',
  ])
  @IsAdmin()
  async viewSponsors(
    ctx: ISceneContext<InitialState, Update.MessageUpdate<Message.TextMessage>>,
  ) {
    const user = ctx.user;
    const message = ctx.message as Message.TextMessage;

    const page = 0;
    const isActive = getStatusByText(ctx);
    const sponsors = await this.sponsorService.getSponsors({ isActive }, page);
    if (!sponsors?.length) {
      await ctx.reply(
        this.i18n.t('mandatory-subscribe.message.empty', { lang: user.lang }),
      );
      return;
    }
    const inlineButtons: InlineKeyboardButton[][] = sponsors.map((sponsor) => {
      const data: ISubscriptionAdminCallbackDataView = {
        isActive,
        action: 'view',
        sponsorId: sponsor.id,
      };
      return [
        {
          text: sponsor.name ?? sponsor.manager ?? `${sponsor.id}`,
          callback_data: JSON.stringify(data),
        },
      ];
    });

    const backBtn: ISubscriptionAdminCallbackData = {
      isActive,
      action: 'back',
      page,
    };
    const nextBtn: ISubscriptionAdminCallbackData = {
      isActive,
      action: 'next',
      page,
    };
    const closeBtn: ISubscriptionAdminCallbackData = {
      action: 'close',
    };

    await ctx.reply(
      this.i18n.t(
        `mandatory-subscribe.message.${isActive ? 'active' : 'disabled'}Sponsor`,
        { lang: user.lang },
      ),
      {
        link_preview_options: {
          is_disabled: true,
        },
        reply_markup: {
          inline_keyboard: [
            ...inlineButtons,
            [
              {
                text: this.i18n.t('core.button.back', { lang: user.lang }),
                callback_data: JSON.stringify(backBtn),
              },
              {
                text: this.i18n.t('core.button.forward', { lang: user.lang }),
                callback_data: JSON.stringify(nextBtn),
              },
            ],
            [
              {
                text: this.i18n.t('core.button.close', { lang: user.lang }),
                callback_data: JSON.stringify(closeBtn),
              },
            ],
          ],
        },
      },
    );
  }

  @HearsTranslate('mandatory-subscribe.button.new')
  @IsAdmin()
  async create(ctx: ISceneContext<InitialState>) {
    await this.createScene.enter(ctx, { prev: ctx.scene.current.id });
  }

  @HearsTranslate('mandatory-subscribe.button.back')
  async back(ctx: ISceneContext<InitialState>) {
    await ctx.scene.enter(AdminScenes.ADMIN);
  }

  @Action(
    (
      value: string,
      ctx: NarrowedContext<
        never,
        Update.CallbackQueryUpdate<CallbackQuery.DataQuery>
      >,
    ) => {
      const cb = ctx.callbackQuery;
      if (!cb) {
        return;
      }
      const data: ISubscriptionAdminCallbackData = JSON.parse(cb.data);
      const action: CallbackAction = 'view';
      return new RegExp(action).exec(data.action);
    },
  )
  async view(
    ctx: ISceneContext<
      InitialState,
      Update.CallbackQueryUpdate<CallbackQuery.DataQuery>
    >,
  ) {
    const { user } = ctx;
    const cb = ctx.callbackQuery;
    const data: ISubscriptionAdminCallbackDataView = JSON.parse(cb.data);
    await ctx.answerCbQuery();

    const sponsor = await this.sponsorService.getSponsorById(data.sponsorId);
    await this.editScene.enter(ctx as any, {
      prev: ctx.scene.current.id,
      sponsorId: sponsor.id,
    });
    return;
  }

  @Action(
    (
      value: string,
      ctx: NarrowedContext<
        never,
        Update.CallbackQueryUpdate<CallbackQuery.DataQuery>
      >,
    ) => {
      const cb = ctx.callbackQuery;
      if (!cb) {
        return;
      }
      const data: ISubscriptionAdminCallbackData = JSON.parse(cb.data);
      const action: CallbackAction = 'close';
      return new RegExp(action).exec(data.action);
    },
  )
  async close(
    ctx: ISceneContext<
      InitialState,
      Update.CallbackQueryUpdate<CallbackQuery.DataQuery>
    >,
  ) {
    await ctx.deleteMessage();
    await ctx.answerCbQuery();
  }

  @Action(
    (
      value: string,
      ctx: NarrowedContext<
        never,
        Update.CallbackQueryUpdate<CallbackQuery.DataQuery>
      >,
    ) => {
      const cb = ctx.callbackQuery;
      if (!cb) {
        return;
      }
      const data: ISubscriptionAdminCallbackData = JSON.parse(cb.data);
      const actions: CallbackAction[] = ['next', 'back'];
      return new RegExp(actions.join('|')).exec(data.action);
    },
  )
  async turnPage(
    ctx: ISceneContext<
      InitialState,
      Update.CallbackQueryUpdate<CallbackQuery.DataQuery>
    >,
  ) {
    const user = ctx.user;
    const cb = ctx.callbackQuery;
    const data: ISubscriptionAdminCallbackDataCtrl = JSON.parse(cb.data);
    const { isActive } = data;

    if (data.page === 0 && data.action === 'back') {
      ctx.answerCbQuery(
        this.i18n.t('core.message.noMore', { lang: ctx.user.lang }),
      );
      return;
    }
    const page =
      data.action === 'next' ? data.page + 1 : Math.max(data.page - 1, 0);
    const sponsors = await this.sponsorService.getSponsors(
      { isActive: data.isActive },
      page,
    );

    if (!sponsors?.length) {
      ctx.answerCbQuery(
        this.i18n.t('core.message.noMore', { lang: user.lang }),
      );
      return;
    }

    const inlineButtons: InlineKeyboardButton[][] = sponsors.map((sponsor) => {
      const data: ISubscriptionAdminCallbackDataView = {
        isActive: isActive,
        action: 'view',
        sponsorId: sponsor.id,
      };
      return [
        {
          text: sponsor.name ?? sponsor.manager ?? `${sponsor.id}`,
          callback_data: JSON.stringify(data),
        },
      ];
    });

    const backBtn: ISubscriptionAdminCallbackData = {
      isActive: isActive,
      action: 'back',
      page,
    };
    const nextBtn: ISubscriptionAdminCallbackData = {
      isActive: isActive,
      action: 'next',
      page,
    };
    const closeBtn: ISubscriptionAdminCallbackData = {
      action: 'close',
    };

    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        ...inlineButtons,
        [
          {
            text: this.i18n.t('core.button.back', { lang: user.lang }),
            callback_data: JSON.stringify(backBtn),
          },
          {
            text: this.i18n.t('core.button.forward', { lang: user.lang }),
            callback_data: JSON.stringify(nextBtn),
          },
        ],
        [
          {
            text: this.i18n.t('core.button.close', { lang: user.lang }),
            callback_data: JSON.stringify(closeBtn),
          },
        ],
      ],
    });
    await ctx.answerCbQuery();
  }
}
