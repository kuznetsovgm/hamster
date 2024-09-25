import { Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Hears, Scene, SceneEnter } from 'nestjs-telegraf';
import { AdminService } from '../admin.service';
import { ButtonsService } from '../buttons.service';
import {
  MandatorySubscribeScene,
  MandatorySubscribeSceneInitialState,
} from '../mandatory-subscribe.interface';
import { SponsorService } from '../sponsor.service';
import { SubscribeService } from '../subscribe.service';
import { ISceneContext } from 'src/bot/bot.interface';
import { HearsTranslate } from 'src/bot/decorator/hears-translate.decorator';
import { IsAdmin } from 'src/bot/decorator/is-admin.decorator';

export interface EditMandatorySubscribeInitialState
  extends MandatorySubscribeSceneInitialState {
  sponsorId: number;
}

@Scene(MandatorySubscribeScene.EDIT)
export class EditScene {
  private readonly logger = new Logger(EditScene.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly subscribeService: SubscribeService,
    private readonly sponsorService: SponsorService,
    private readonly buttonsService: ButtonsService,
    private readonly i18n: I18nService,
  ) {}

  async enter(
    ctx: ISceneContext,
    initialState: EditMandatorySubscribeInitialState,
  ) {
    await ctx.scene.enter(MandatorySubscribeScene.EDIT, initialState);
  }

  @SceneEnter()
  @IsAdmin()
  async sceneEnter(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    const { user } = ctx;
    const state = ctx.scene.session.state;
    const sponsor = await this.sponsorService.getSponsorById(
      state.sponsorId,
      true,
    );
    const count = await this.subscribeService.count(sponsor.chat_id);
    const keyboard = [
      [
        await this.buttonsService.keyboard.admin.toggleactive(
          user.lang,
          sponsor.isActive,
        ),
      ],
      [await this.buttonsService.keyboard.admin.refresh(user.lang)],
    ];
    if (!sponsor.is_bot) {
      keyboard.push([
        {
          text: ctx.t('mandatory-subscribe.button.editLink'),
        },
        { text: ctx.t('mandatory-subscribe.button.editLangs') },
      ]);
    }
    if (!sponsor.isActive) {
      keyboard.push([
        sponsor.deleted_at
          ? await this.buttonsService.keyboard.admin.restore(user.lang)
          : await this.buttonsService.keyboard.admin.remove(user.lang),
      ]);
    }
    keyboard.push([await this.buttonsService.keyboard.common.back(user.lang)]);
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.viewSponsor', {
        lang: user.lang,
        args: {
          id: sponsor.id,
          name: sponsor.name,
          manager: sponsor.manager,
          link: sponsor.link,
          channelId: sponsor.chat_id,
          title: sponsor.title,
          langs: sponsor.langs?.join(',') ?? '',
          count,
        },
      }),
      {
        link_preview_options: {
          is_disabled: true,
        },
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        },
      },
    );
  }

  @HearsTranslate('mandatory-subscribe.button.toggleactive')
  @IsAdmin()
  async toggleActive(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    const { user } = ctx;
    const state = ctx.scene.session.state;
    const sponsor = await this.sponsorService.getSponsorById(state.sponsorId);
    const res = await this.sponsorService.setActive(
      sponsor.id,
      !sponsor.isActive,
    );
    if (!res) {
      await ctx.reply(
        this.i18n.t('mandatory-subscribe.message.botNotAdmin', {
          lang: user.lang,
        }),
      );
    }
    await ctx.scene.reenter();
    // await ctx.reply(this.i18n.t('mandatory-subscribe.message.viewSponsor', {lang: user.lang, args: {
    //     id: sponsor.id,
    //     name: sponsor.name,
    //     manager: sponsor.manager,
    //     link: sponsor.link,
    //     channelId: sponsor.chat_id,
    //     title: sponsor.link,
    // }}), {
    //     reply_markup: {
    //         keyboard: [
    //             [
    //                 await this.buttonsService.keyboard.admin.toggleactive(user.lang, sponsor.isActive),
    //             ],
    //             [
    //                 await this.buttonsService.keyboard.common.cancel(user.lang),
    //             ],
    //         ],
    //         resize_keyboard: true,
    //     },
    // });
  }

  @HearsTranslate('mandatory-subscribe.button.refresh')
  @IsAdmin()
  async refresh(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    const state = ctx.scene.session.state;
    const sponsor = await this.sponsorService.getSponsorById(state.sponsorId);
    let newName: string;
    if (sponsor.is_bot) {
      const me = await this.adminService.getMe(sponsor.token);
      newName = me.first_name;
    } else {
      const chat = await this.adminService.getChat(sponsor.chat_id);
      newName = chat.type === 'private' ? chat.first_name : chat.title;
    }
    const res = await this.sponsorService.update(
      { id: sponsor.id },
      { name: newName },
    );
    await ctx.scene.reenter();
  }

  @HearsTranslate('mandatory-subscribe.button.editLink')
  @IsAdmin()
  async editLink(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    const state = ctx.scene.session.state;
    await ctx.scene.enter(MandatorySubscribeScene.EDIT_LINK, {
      id: state.sponsorId,
    });
  }

  @HearsTranslate('mandatory-subscribe.button.editLangs')
  @IsAdmin()
  async editLangs(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    const state = ctx.scene.session.state;
    await ctx.scene.enter(MandatorySubscribeScene.EDIT_LANGS, {
      id: state.sponsorId,
    });
  }

  @HearsTranslate('mandatory-subscribe.button.remove')
  @IsAdmin()
  async remove(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    const { user } = ctx;
    const state = ctx.scene.session.state;
    await this.sponsorService.remove(state.sponsorId);
    await ctx.scene.reenter();
  }

  @HearsTranslate('mandatory-subscribe.button.restore')
  @IsAdmin()
  async restore(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    const { user } = ctx;
    const state = ctx.scene.session.state;
    await this.sponsorService.restore(state.sponsorId);
    await ctx.scene.reenter();
  }

  @HearsTranslate('mandatory-subscribe.button.back')
  async cancel(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    await ctx.scene.enter(
      ctx.scene.session.state.prev ?? MandatorySubscribeScene.ADMIN,
    );
  }
}
