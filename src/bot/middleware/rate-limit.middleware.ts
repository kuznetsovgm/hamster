import { LoggerService } from "@nestjs/common";
import { Context } from "telegraf";

class MemoryStore {
    private hits: Map<number, number>;
    constructor (clearPeriod: number) {
        this.hits = new Map();
        setInterval(this.reset.bind(this), clearPeriod * 1000);
    }

    incr (key: number) {
        var counter = this.hits.get(key) || 0
        counter++
        this.hits.set(key, counter)
        return counter
    }

    reset () {
        this.hits.clear()
    }
}

export function rateLimit (options?: {
    window?: number,
    limit?: number,
    keyGenerator?: (ctx: Context) => any,
    onLimitExceeded?: (ctx: Context, next: Function) => any,
    logger?: LoggerService,
}) {
    const logger = options?.logger || console;
    const config = Object.assign({
        window: 1,
        limit: 1,
        keyGenerator: (ctx: Context) => ctx.from?.id,
        logger,
        onLimitExceeded: (ctx: Context, next: Function) => {
            logger.error(`${ctx.from?.id} limit exceed`);
        }
    }, options)
    const store = new MemoryStore(config.window);
    return (ctx: Context, next: Function) => {
        if (!ctx.message) {
            return next();
        }
        if ('media_group_id' in ctx.message) {
            return next();
        }

        const key = config.keyGenerator(ctx);
        if (!key) {
            return next();
        }
        const hit = store.incr(key);
        
        return hit < config.limit + 1
            ? next() 
            : (
                hit === config.limit + 1
                    ? ctx.reply('Не отправляйте сообщения слишком быстро.')
                    : config.onLimitExceeded(ctx, next)
            );
    }
}