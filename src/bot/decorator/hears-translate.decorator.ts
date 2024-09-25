import { createListenerDecorator } from "nestjs-telegraf";
import { ISceneContext } from "../bot.interface";

export function HearsTranslate(keys: string | string[]) {
    return <T>(
        target: Object, 
        propertyKey: string | symbol, 
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> | void => {
        const hearsDecorator = createListenerDecorator('hears');
        /**
         * @todo
         * @fix ctx: any
         * ctx: ISceneContext | IWizardContext | IContext (?)
         */
        return hearsDecorator((value: string, ctx: any) => {
            try {
                if (!('i18n' in ctx) || !('user' in ctx)) {
                    return null;
                }
                if (!Array.isArray(keys)) {
                    keys = [keys];
                }
                const translatedTexts = keys.map<string>(key => ctx.t(key, {lang: ctx.user.lang}));
                return new RegExp(translatedTexts.join('|')).exec(value);
            } catch (e) {
                console.error(e);
                return null;
            }
        })(target, propertyKey, descriptor);
    }
}