import { createListenerDecorator } from 'nestjs-telegraf';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';
import { ISceneStateBase, ISceneContext } from '../bot.interface';

export function ActionData<T extends string | string[]>(actions: T) {
  return <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> | void => {
    const actionDecorator = createListenerDecorator('action');
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    const cb: (value: string, ctx: never) => RegExpExecArray = (
      value: string,
      ctx: ISceneContext<
        ISceneStateBase,
        Update.CallbackQueryUpdate<CallbackQuery.DataQuery>
      >,
    ) => {
      try {
        /**
         * @to-do
         */
        //@ts-ignore
        const cq = ctx.callbackQuery;
        if (!cq?.data) {
          return null;
        }
        const data = JSON.parse(cq?.data);
        if (!data || !actionsArray.includes(data.action)) {
          return null;
        }

        return /.*/i.exec(value) as RegExpExecArray;
      } catch (e) {
        console.error(e);
        return null;
      }
    };

    return actionDecorator(cb)(target, propertyKey, descriptor);
  };
}
