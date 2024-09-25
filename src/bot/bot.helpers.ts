import { Context, TelegramError } from 'telegraf';
import { IWizardContext } from './bot.interface';

export const wizardNextStep = async (ctx: IWizardContext, call: boolean = true) => {
    ctx.wizard.next();
    if (call) {
        const wizard = ctx.wizard as any;
        await wizard.steps[ctx.wizard.cursor](ctx);
    }
}
export const wizardBackStep = async (ctx: IWizardContext, call: boolean = true) => {
    ctx.wizard.back();
    if (call) {
        const wizard = ctx.wizard as any;
        await wizard.steps[ctx.wizard.cursor](ctx);
    }
}

export const e = (e: unknown): e is TelegramError => {
    return e instanceof TelegramError;
}

export const getUserId = (ctx: Context): number | null => { 
    if ('message' in ctx.update) {
        const message = ctx.update.message;
        return message.from.id;
    } else if ('callback_query' in ctx.update) {
        const cb = ctx.update.callback_query;
        return cb.from.id ?? cb.message?.chat.id;
    } else if ('inline_query' in ctx.update){
        const iq = ctx.update.inline_query;
        return iq.from.id;
    } else if ('my_chat_member' in ctx.update) {
        return ctx.update.my_chat_member.from.id;
    }
    return null;
}