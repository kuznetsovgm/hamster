import { Logger, UseFilters } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Scene, SceneEnter } from 'nestjs-telegraf';
import { BotScene, ISceneContext } from 'src/bot/bot.interface';
import { RidingExtrimePromoService } from 'src/hamster/riding-extrime-promo/riding-extrime-promo.service';
import { HearsTranslate } from '../decorator/hears-translate.decorator';
import { UserService } from '../user/user.service';
import { REFERRAL_PAYLOAD_STARTS_WITH } from '../user/user.constants';
import { UserRole } from '../user/user.interface';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';

@Scene(BotScene.MAIN)
@UseFilters(TelegrafExceptionFilter)
export class MainScene {
  private readonly logger = new Logger(MainScene.name);
  constructor(
    private readonly i18n: I18nService,
    private readonly promocodeService: RidingExtrimePromoService,
    private readonly userService: UserService,
  ) {}

  @SceneEnter()
  async sceneEnter(ctx: ISceneContext) {
    const replyMarkup = {
      keyboard: [
        [
          {
            text: ctx.t('bot.button.getPromoCode'),
          },
        ],
      ],
      resize_keyboard: true,
    };
    const text = ctx.t('bot.message.mainMenu', {
      args: {},
    });

    await ctx.reply(text, {
      reply_markup: replyMarkup,
    });
  }

  @HearsTranslate('bot.button.getPromoCode')
  async getPromoCode(ctx: ISceneContext) {
    const availableByTime =
      await this.promocodeService.isPromoCodeAvailableByTime(ctx.user.id);
    let availableByReferrals = false;
    if (!availableByTime) {
      availableByReferrals =
        await this.userService.isPromoCodeAvailableByReferrals(ctx.user);
    }
    const replyMarkup = {
      keyboard: [
        [
          {
            text: ctx.t('bot.button.getPromoCode'),
          },
        ],
      ],
      resize_keyboard: true,
    };
    if (
      !availableByTime &&
      !availableByReferrals &&
      ctx.user.role !== UserRole.ADMIN
    ) {
      replyMarkup.keyboard.push([
        {
          text: ctx.t('bot.button.myReferrals'),
        },
      ]);
      const needReferralsCount = this.userService.getNeedReferralsCount(
        ctx.user,
      );
      await ctx.reply(
        ctx.t('bot.message.promoCodeIsNotAvailable', {
          args: {
            count: needReferralsCount,
            link: `https://t.me/${ctx.botInfo.username}?start=${REFERRAL_PAYLOAD_STARTS_WITH}${ctx.user.id}`,
          },
        }),
        { reply_markup: replyMarkup, parse_mode: 'HTML' },
      );
      return;
    }
    const promoCodes = await this.promocodeService.getNewPromocode();
    ctx
      .reply(
        ctx.t('bot.message.promoCodeMessage', {
          args: {
            promoCodes: promoCodes
              .map((p) => `<code>${p.promoCode}</code>`)
              .join('\n'),
          },
        }),
        { reply_markup: replyMarkup, parse_mode: 'HTML' },
      )
      .then(async () => {
        await Promise.all(
          promoCodes.map((promoCode) =>
            this.promocodeService.markPromocodeAsUsed(
              promoCode.id,
              ctx.user.id,
            ),
          ),
        );
      });
  }

  @HearsTranslate('bot.button.myReferrals')
  async myReferralsList(ctx: ISceneContext) {
    const [referrals, referralsCount] = await this.userService.getUserReferrals(
      ctx.user.id,
    );
    const needReferralsCount = this.userService.getNeedReferralsCount(ctx.user);
    const needToReceiveNextCode = Math.max(
      0,
      ctx.user.referralsCountSnapshot + needReferralsCount - referralsCount,
    );
    const referralsText = referrals
      .map((referral, i) => `${i + 1}: ${referral.first_name}`)
      .join('\n');

    ctx.reply(
      ctx.t('bot.message.myReferrals', {
        args: { referralsCount, needToReceiveNextCode, referralsText },
      }),
      { parse_mode: 'HTML' },
    );
  }
}
