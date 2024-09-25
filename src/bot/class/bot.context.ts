import { Context as TelegrafContext } from 'telegraf';

export class Context extends TelegrafContext {
  // callNextStep = () => {
  //   if (!('wizard' in this)) {
  //     return;
  //   }
  //   (
  //     this.wizard as WizardContextWizard<WizardContext<WizardSessionData>>
  //   ).next();
  //   (this.wizard as any).steps[(this.wizard as any).cursor](this);
  // };
}
