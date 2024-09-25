import { Injectable } from '@nestjs/common';
import { Middleware } from 'telegraf';
import { IContext, IWizardContext } from '../bot.interface';

@Injectable()
export class ContextMiddleware {
  constructor() {}

  middleware(): Middleware<IWizardContext | IContext> {
    return async (
      ctx: IWizardContext | IContext,
      next: () => Promise<void>,
    ) => {
      // if ('wizard' in ctx) {
      //     const wizard = ctx.wizard as any;
      //     Object.defineProperty(ctx.wizard, 'callNextStep', {
      //         value: () => {
      //             ctx.wizard.next();
      //             wizard.steps[ctx.wizard.cursor](ctx);
      //         }
      //     });
      //     Object.defineProperty(ctx.wizard, 'callPrevStep', {
      //         value: () => {
      //             ctx.wizard.back();
      //             wizard.steps[ctx.wizard.cursor](ctx);
      //         }
      //     });
      // }

      return next();
    };
  }
}
