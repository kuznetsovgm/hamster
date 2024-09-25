import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IInlineButtonsStore } from 'src/bot/bot.interface';
import { KeyboardButton } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class ButtonsService {
  private readonly logger = new Logger(ButtonsService.name);
  constructor(private readonly i18n: I18nService) {}

  inlineButtons: IInlineButtonsStore = {
    admin: {},
    common: {
      cancel: (lang: string) => ({
        text: this.i18n.t('admin.button.cancel', { lang }),
        callback_data: JSON.stringify({
          action: 'cancel',
        }),
      }),
      editMsg: (lang: string, msgId: number) => ({
        text: this.i18n.t('admin.button.editMsg', { lang }),
        callback_data: JSON.stringify({
          action: 'edit_msg',
          id: msgId,
        }),
      }),
    },
  };

  keyboard = {
    common: {
      back: (lang: string): KeyboardButton => ({
        text: this.i18n.t('admin.button.back', { lang }),
      }),
      cancel: (lang: string): KeyboardButton => ({
        text: this.i18n.t('admin.button.cancel', { lang }),
      }),
    },
    admin: {
      statistic: (lang: string): KeyboardButton => ({
        text: this.i18n.t('admin.button.statistic', { lang }),
      }),
      exportUsers: (lang: string): KeyboardButton => ({
        text: this.i18n.t('admin.button.usersList', { lang }),
      }),
      mailing: (lang: string): KeyboardButton => ({
        text: this.i18n.t('admin.button.mailing', { lang }),
      }),
      creatives: (lang: string): KeyboardButton => ({
        text: this.i18n.t('admin.button.creatives', { lang }),
      }),
      sponsors: (lang: string): KeyboardButton => ({
        text: this.i18n.t('admin.button.sponsors', { lang }),
      }),
    },
  };
}
