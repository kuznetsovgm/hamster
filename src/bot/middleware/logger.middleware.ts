import { Logger } from '@nestjs/common';
import { Context } from 'telegraf';

const logger = new Logger('TelegrafUpdate');

export const debugUpdate = async (ctx: Context, next: () => Promise<any>) => {
  logger.debug(`Incoming update: ${JSON.stringify(ctx.update)}`);

  const oldCallApi = ctx.telegram.callApi;
  const newCallApi: typeof ctx.telegram.callApi = async function newCallApi(
    this: typeof ctx.telegram,
    method,
    payload,
    { signal } = {},
  ) {
    logger.debug(`Outgoing request: ${method} - ${JSON.stringify(payload)}`);
    return oldCallApi.call(this, method, payload, { signal });
  };
  ctx.telegram.callApi = newCallApi;
  return next();
};
