import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InlineKeyboardButton, KeyboardButton } from 'telegraf/typings/core/types/typegram';

interface IInlineButtonsSet {
    [key: string]: (...args: any) => InlineKeyboardButton | Promise<InlineKeyboardButton>
}
interface IInlineButtonsStore {
    [key: string]: IInlineButtonsSet
}
interface KeyboardButtonSet {
    [key: string]: (...args: any) => KeyboardButton | Promise<KeyboardButton>
}
interface IKeyboardButtonsStore {
    [key: string]: KeyboardButtonSet | IKeyboardButtonsStore | ((...args: any) => KeyboardButton | Promise<KeyboardButton>);
}

@Injectable()
export class ButtonsService {
    private readonly logger = new Logger(ButtonsService.name);
    constructor(
        private readonly i18n: I18nService,
    ) {}

    inlineButtons: IInlineButtonsStore = {
    }

    keyboard = {
        common: {
            back: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.back', {lang}),
            }),
            cancel: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.cancel', {lang}),
            }),
            yes: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.yes', {lang}),
            }),
            no: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.no', {lang}),
            }),
            skip: async (lang: string): Promise<KeyboardButton> => ({
                text:  this.i18n.t('mandatory-subscribe.button.skip', {lang}),
            }),
            delete: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.delete', {lang}),
            }),
        },
        admin: {
            new: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.new', {lang}),
            }),
            active: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.active', {lang}),
            }),
            disabled: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.disabled', {lang}),
            }),
            toggleactive: async (lang: string, ready: boolean): Promise<KeyboardButton> => ({
                text: (!!ready ? '✅ ' : '❌ ') + this.i18n.t('mandatory-subscribe.button.toggleactive', {lang}),
            }),
            editLink: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.editLink', {lang}),
            }),
            refresh: async (lang: string): Promise<KeyboardButton> => ({
                text: this.i18n.t('mandatory-subscribe.button.refresh', {lang}),
            }),
            remove: async (lang: string): Promise<KeyboardButton> => ({
                text: ('🗑 ') + this.i18n.t('mandatory-subscribe.button.remove', {lang}),
            }),
            restore: async (lang: string): Promise<KeyboardButton> => ({
                text: ('🔙 ') + this.i18n.t('mandatory-subscribe.button.restore', {lang}),
            }),
        },

    }
}
