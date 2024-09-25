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

export interface InitialState extends MandatorySubscribeSceneInitialState {
  id: number;
}
export interface AddSponsorState extends InitialState {
  id: number;
  link?: string;
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
  INVITE_LINK,
  HANDLE_INVITE_LINK,
  SAVE,
}

@Wizard(MandatorySubscribeScene.EDIT_LINK)
export class EditLinkScene {
  private readonly logger = new Logger(EditLinkScene.name);

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
  @Hears(/https?:\/\/.*/)
  async handleLink(ctx: IWizardContext<AddSponsorState>) {
    const res = await this.adminService.handleLink(ctx);
    if (!res) {
      await this.wizardBackStep(ctx, true);
      return;
    }
    ctx.scene.session.state.link = res;
    await this.wizardNextStep(ctx, true);
  }

  @HearsTranslate('mandatory-subscribe.button.back')
  async cancel(ctx: ISceneContext<EditMandatorySubscribeInitialState>) {
    await ctx.scene.enter(
      ctx.scene.session.state.prev ?? MandatorySubscribeScene.ADMIN,
    );
  }

  @WizardStep(CreateSteps.SAVE)
  async save(ctx: IWizardContext<AddSponsorState>) {
    const state = ctx.scene.session.state;
    const res = await this.adminService.updateSponsorLink(state.id, state.link);
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
