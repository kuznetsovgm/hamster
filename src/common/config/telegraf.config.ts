import { ConfigService } from '@nestjs/config';
import { TelegrafModuleOptions } from 'nestjs-telegraf';
import { Redis } from '@telegraf/session/redis';
import { Context } from 'src/bot/class/bot.context';
import { I18nMiddleware } from 'src/bot/middleware/i18n.middleware';
import { debugUpdate } from 'src/bot/middleware/logger.middleware';
import { UserMiddleware } from 'src/bot/middleware/user.middleware';
import { session } from 'telegraf';
import { CatchErrorMiddleware } from 'src/bot/middleware/catchError.middleware';
import { DropOldUpdatesMiddleware } from 'src/bot/middleware/drop-old-updates.middleware';
import { SubscribeMiddleware } from 'src/bot/modules/mandatory-subscribe/subscribe.middleware';
import { DropUpdateByLangMiddleware } from 'src/bot/middleware/drop-by-lang.middleware';

export const getTelegrafConfig = async (
  configService: ConfigService,
  userMiddleware: UserMiddleware,
  i18nMiddleware: I18nMiddleware,
  catchErrorMiddleware: CatchErrorMiddleware,
  dropOldUpdatesMiddleware: DropOldUpdatesMiddleware,
  subscribeMiddleware: SubscribeMiddleware,
  dropUpdatesByLangMiddleware: DropUpdateByLangMiddleware,
): Promise<TelegrafModuleOptions> => {
  const [redisUser, redisPassword, redisHost, redisPort] = [
    configService.get('REDIS_USER'),
    configService.get('REDIS_PASSWORD'),
    configService.get('REDIS_HOST'),
    configService.get('REDIS_PORT'),
  ];
  const store = Redis({
    url: `redis://${redisUser}:${redisPassword}@${redisHost}:${redisPort}`,
  });
  return {
    token: configService.getOrThrow('BOT_TOKEN'),
    options: {
      contextType: Context,
    },
    launchOptions: {},
    middlewares: [
      debugUpdate,
      dropOldUpdatesMiddleware.middleware(),
      dropUpdatesByLangMiddleware.middleware(),
      session({ store }),
      i18nMiddleware.middleware(),
      userMiddleware.userMiddleware(),
      catchErrorMiddleware.middleware(),
      subscribeMiddleware.middleware(),
    ],
  };
};
