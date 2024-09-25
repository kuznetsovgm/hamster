import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { InsertResult, MoreThan, Repository } from 'typeorm';
import { Subscribe } from './entity/subscribe.entity';
import { CallbackDataMandatorySubscribe } from './mandatory-subscribe.interface';
import { SponsorService } from './sponsor.service';
import { TelegramService } from './telegram.service';
import { IContext } from 'src/bot/bot.interface';
import {
  dateToISO8601StringUTC,
  toMilliseconds,
} from 'src/common/helpers/app.helpers';
import { User } from 'src/entities/typeorm/user.entity';

@Injectable()
export class SubscribeService {
  constructor(
    @InjectRepository(Subscribe)
    private readonly subscribeRepository: Repository<Subscribe>,
    private readonly configService: ConfigService,
    private readonly sponsorService: SponsorService,
    private readonly telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  async checkUser(user: User): Promise<boolean> {
    const activeSponsors = await this.sponsorService.getSponsors({
      isActive: true,
      lang: user.lang,
    });
    // for(let i = 0; i < activeSponsors.length; i++) {
    //     const sponsor = activeSponsors[i];
    //     const check = await this.userIsSubscriber(userId, sponsor.chat_id);
    //     if (!check) {
    //         return false;
    //     }
    // }
    const promises = activeSponsors.map((sponsor) => {
      return new Promise(async (resolve, reject) => {
        const check = await this.userIsSubscriber(
          user.id,
          sponsor.chat_id,
          sponsor.token ?? this.configService.get('BOT_TOKEN'),
          sponsor.is_bot,
        );
        if (!check) {
          // reject(`user ${userId} is not subscriber ${sponsor.chat_id}`);
          resolve(false);
        }
        resolve(true);
      });
    });
    const res = await Promise.all(promises);
    return !res.includes(false);
  }

  async userIsSubscriber(
    userId: number,
    chatId: number,
    token: string,
    isBot: boolean,
  ): Promise<boolean> {
    const cache = await this.checkUserIsSubscriberCached(userId, chatId);
    if (cache) {
      return true;
    }
    const tg = isBot
      ? await this.checkUserIsSubscriberBotTg(userId, chatId, token)
      : await this.checkUserIsSubscriberChannelTg(userId, chatId, token);
    if (tg) {
      await this.updateCache(userId, chatId);
      return true;
    }
    return false;
  }

  async checkUserIsSubscriberCached(
    userId: number,
    chatId: number,
  ): Promise<boolean> {
    const res = await this.subscribeRepository.findOne({
      where: {
        user_id: userId,
        chat_id: chatId,
        // check: true,
        updated_at: MoreThan(
          new Date(
            Date.now() -
              toMilliseconds(
                +this.configService.get(
                  'MANDATORY_SUBSCRIPTION_CACHE_SECONDS',
                  60,
                ),
                'sec',
              ),
          ),
        ),
      },
    });
    return !!res ?? false;
  }

  async checkUserIsSubscriberChannelTg(
    userId: number,
    chatId: number,
    token: string,
  ): Promise<boolean> {
    try {
      const res = await this.telegramService.getChatMember(
        token,
        chatId,
        userId,
      );
      if (!['member', 'creator', 'administrator'].includes(res.status)) {
        return false;
      }
    } catch (e) {
      // если админ канала удалил или не добавил в админы бота-чекера
      // if (
      //   (e.error_code === 400 && e.description?.match('chat not found')) ||
      //   e.error_code === 403
      // ) {
      //   console.log(e);
      //   await this.sponsorService.update(
      //     { chat_id: chatId },
      //     { isActive: false },
      //   );
      //   return true;
      // }
      return false;
    }
    return true;
  }

  async checkUserIsSubscriberBotTg(
    userId: number,
    chatId: number,
    token: string,
  ): Promise<boolean> {
    try {
      const res = await this.telegramService.getChat(token, userId);
      if (res) {
        return true;
      }
    } catch (e) {
      // если админ сменил токен бота
      if (
        e.error_code === 403 ||
        e.error_code === 401 ||
        e.error_code === 404
      ) {
        console.log(e);
        await this.sponsorService.update(
          { chat_id: chatId },
          { isActive: false },
        );
        return true;
      }
      return false;
    }
    return true;
  }

  async updateCache(
    userId: number,
    chatId: number,
  ): Promise<InsertResult | Subscribe> {
    return await this.subscribeRepository
      .createQueryBuilder()
      .insert()
      .into(Subscribe)
      .values({
        user_id: userId,
        chat_id: chatId,
      })
      .orUpdate(['updated_at'], ['user_id', 'chat_id'])
      .execute();
    // const entity = this.subscribeRepository.create({
    //   user_id: userId,
    //   chat_id: chatId,
    // });
    // return await this.subscribeRepository.save(entity);
  }

  async sendSponsorMessage(ctx: IContext, test: boolean = false) {
    const userId = ctx.from.id;
    const lang = ctx.user.lang;
    const defaultText = this.i18n.t(
      'mandatory-subscribe.message.mandatory_subscribe_default_btn_text',
      { lang },
    );
    const active = await this.sponsorService.getSponsors({
      isActive: true,
      lang: lang,
    });
    if (!active.length) {
      return null;
    }
    const alreadySubscribe = await Promise.all(
      active.map((a) =>
        this.userIsSubscriber(userId, a.chat_id, a.token, a.is_bot),
      ),
    );
    const newSponsors = active.filter((val, i) => !alreadySubscribe[i] || test);
    const keyboard: InlineKeyboardButton[][] = [];
    for (let i = 0; i < newSponsors.length; i++) {
      const el = newSponsors[i];
      const key = {
        text: el.title ?? `${defaultText} ${i + 1}`,
        url: el.link,
      };
      if (
        keyboard.length === 0 ||
        keyboard.at(-1).length ===
          (+this.configService.get('MANDATORY_SUBSCRIPTION_BTN_COLUMNS') || 2)
      ) {
        keyboard.push([key]);
      } else {
        keyboard.at(-1).push(key);
      }
    }

    if (!test) {
      const checkKeyData: CallbackDataMandatorySubscribe = {
        action: 'check_subscribe',
      };
      keyboard.push([
        {
          text: this.i18n.t('mandatory-subscribe.button.check', { lang }),
          callback_data: JSON.stringify(checkKeyData),
        },
      ]);
    }

    return await ctx.telegram.sendMessage(
      userId,
      this.i18n.t('mandatory-subscribe.message.mandatory_subscribe_text', {
        lang,
      }),
      {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      },
    );
  }

  //   async answerInlineQuery(ctx: IContext) {
  //     const { user } = ctx;
  //     await ctx.answerInlineQuery([], {
  //       switch_pm_text: this.i18n.t('core.button.notStartedHint', {
  //         lang: user.lang,
  //       }),
  //       // switch_pm_parameter: SWITCH_PM_NOT_STARTED,
  //       cache_time: 0,
  //       is_personal: true,
  //     });
  //   }

  async count(channelId: number): Promise<number> {
    return await this.subscribeRepository.count({
      where: { chat_id: channelId },
    });
  }
}
