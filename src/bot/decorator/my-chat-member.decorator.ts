import { On } from "nestjs-telegraf";
import { IContext } from "../bot.interface";
import { ChatMember } from "telegraf/typings/core/types/typegram";

export function MyChatMember(statuses: ChatMember['status'][]) {
    return <T extends (...args: any[]) => any>(
        target: Object, 
        propertyKey: string | symbol, 
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> | void => {

        const originalMethod = descriptor.value;
        // @ts-ignore
        descriptor.value = function(...args: [IContext<Update>, any]) {
            const [ctx, next] = args;
            if (ctx.updateType === 'my_chat_member') {
                const newStatus = ctx.myChatMember?.new_chat_member.status;
                if (!statuses.length || statuses.includes(newStatus)){
                    // @ts-ignore
                    return originalMethod.apply(this, args);
                }
            }
    
            return next();
        };
    
        return On('my_chat_member')(target, propertyKey, descriptor);
    }
}