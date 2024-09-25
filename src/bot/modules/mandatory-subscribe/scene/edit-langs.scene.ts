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
import { ISceneContext, IWizardContext } from 'src/bot/bot.interface';
import { IsAdmin } from 'src/bot/decorator/is-admin.decorator';
import { HearsTranslate } from 'src/bot/decorator/hears-translate.decorator';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

export interface InitialState extends MandatorySubscribeSceneInitialState {
  id: number;
}
export interface SponsorLangsState extends InitialState {
  id: number;
  langs?: string[];
}

export enum CreateSteps {
  ENTER,
  LANGS,
  HANDLE_LANGS,
  SAVE,
}

@Wizard(MandatorySubscribeScene.EDIT_LANGS)
export class EditLangsScene {
  private readonly logger = new Logger(EditLangsScene.name);

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
  async sceneEnter(ctx: IWizardContext<SponsorLangsState>) {
    await this.wizardNextStep(ctx, true);
  }

  @WizardStep(CreateSteps.LANGS)
  async enterLink(ctx: IWizardContext<SponsorLangsState>) {
    const { user } = ctx;
    await ctx.reply(
      this.i18n.t('mandatory-subscribe.message.enterLangs', {
        lang: user.lang,
      }),
      {
        reply_markup: {
          keyboard: [
            [{ text: ctx.t('mandatory-subscribe.button.empty') }],
            [await this.buttonsService.keyboard.common.cancel(user.lang)],
          ],
          resize_keyboard: true,
        },
      },
    );
    await this.wizardNextStep(ctx, false);
  }

  @HearsTranslate('mandatory-subscribe.button.all')
  async allLangs(ctx: IWizardContext<SponsorLangsState>) {
    ctx.scene.session.state.langs = null;
    await this.wizardNextStep(ctx, true);
  }

  @WizardStep(CreateSteps.HANDLE_LANGS)
  @Hears(/.*/)
  async handleLink(
    ctx: IWizardContext<
      SponsorLangsState,
      Update.MessageUpdate<Message.TextMessage>
    >,
  ) {
    try {
      const langs = ctx.text.split(/[,\s\n]+/);
      if (!langs?.length) {
        throw new Error('Enter langs list');
      }
      ctx.scene.session.state.langs = langs;
      await this.wizardNextStep(ctx, true);
    } catch (e) {
      await this.wizardBackStep(ctx, true);
      return;
    }
  }

  @HearsTranslate('mandatory-subscribe.button.back')
  async cancel(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    await ctx.scene.enter(
      ctx.scene.session.state.prev ?? MandatorySubscribeScene.ADMIN,
    );
  }

  @WizardStep(CreateSteps.SAVE)
  async save(ctx: IWizardContext<SponsorLangsState>) {
    const state = ctx.scene.session.state;
    const res = await this.adminService.updateSponsorLangs(
      state.id,
      state.langs,
    );
    const initialState: EditMandatorySubscribeInitialState = {
      sponsorId: state.id,
      prev: MandatorySubscribeScene.ADMIN,
    };
    await ctx.scene.enter(MandatorySubscribeScene.EDIT, initialState);
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
