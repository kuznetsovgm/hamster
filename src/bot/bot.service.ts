import { Injectable } from '@nestjs/common';
import {
  BotCommand as BotCommandEnum,
  IContext,
  ISceneContext,
  IWizardContext,
} from './bot.interface';
import { BotCommand } from 'telegraf/typings/core/types/typegram';
import { Context } from 'telegraf';
import { COMMANDS_DESCRIPTION } from './bot.constants';

@Injectable()
export class BotService {
  static async wizardNextStep(ctx: IWizardContext, call: boolean = true) {
    ctx.wizard.next();
    if (call) {
      const wizard = ctx.wizard as any;
      await wizard.steps[ctx.wizard.cursor](ctx);
    }
  }
  static async wizardBackStep(ctx: IWizardContext, call: boolean = true) {
    ctx.wizard.back();
    if (call) {
      const wizard = ctx.wizard as any;
      await wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  isDirectChat(ctx: Context | IContext | ISceneContext | IWizardContext) {
    return !!(ctx.from?.id === ctx.chat?.id);
  }

  async setCommands(ctx: Context) {
    const commands: BotCommand[] = Object.keys(BotCommandEnum).map<BotCommand>(
      (command: BotCommandEnum) => ({
        // @ts-ignore
        command: BotCommandEnum[command],
        // @ts-ignore
        description:
          COMMANDS_DESCRIPTION[BotCommandEnum[command]].shortDescription,
      }),
    );
    const id = ctx.chat?.id ?? ctx.from?.id;
    if (commands.length > 0 && id) {
      await ctx.telegram.setMyCommands(commands, {
        scope: {
          type: 'chat',
          chat_id: id,
        },
      });
    }
  }
}
