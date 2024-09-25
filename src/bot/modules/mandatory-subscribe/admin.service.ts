import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { CreateSponsorDto } from './dto/createSponsor.dto';
import { InitialState } from './scene/admin.scene';
import { AddSponsorState } from './scene/create.scene';
import { SponsorService } from './sponsor.service';
import { TelegramService } from './telegram.service';
import { ISceneContext, IWizardContext } from 'src/bot/bot.interface';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class AdminService {
  constructor(
    private readonly sponsorService: SponsorService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async viewActiveSponsors(ctx: ISceneContext<InitialState>) {}

  async viewDisabledSponsors(ctx: ISceneContext<InitialState>) {}

  async createSponsor(create: CreateSponsorDto) {
    const res = await this.sponsorService.create(create);
    return res;
  }

  async updateSponsorLink(id: number, link: string) {
    const res = await this.sponsorService.update({ id }, { link });
    return res;
  }

  async updateSponsorLangs(id: number, langs: string[] | undefined) {
    const res = await this.sponsorService.update({ id }, { langs });
    return res;
  }

  async handleManagerUsername(
    ctx: IWizardContext<
      AddSponsorState,
      Update.MessageUpdate<Message.TextMessage>
    >,
  ) {
    const { user } = ctx;
    let username: string;
    if (
      'forward_origin' in ctx.message &&
      ctx.message.forward_origin.type === 'user'
    ) {
      username = ctx.message.forward_origin.sender_user.username
        ? `@${ctx.message.forward_origin.sender_user.username}`
        : ctx.message.forward_origin.sender_user.first_name;
    } else if (
      'forward_origin' in ctx.message &&
      ctx.message.forward_origin.type === 'hidden_user'
    ) {
      username = ctx.message.forward_origin.sender_user_name;
    } else if ('text' in ctx.message) {
      username = ctx.message.text;
    } else {
      // await ctx.reply(this.i18n.t('mandatory-subscribe.message.enterSponsorUsername', {lang: user.lang}));
      return null;
    }
    return username;
  }

  async handleLink(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    let link: string;
    if (
      'text' in ctx.message &&
      ctx.message.text.match(/^http[s]?:\/\/t.me\/.*/i)
    ) {
      link = ctx.message.text;
    } else {
      // await ctx.reply(this.i18n.t('mandatory-subscribe.message.enterLink', {lang: user.lang}));
      return null;
    }
    return link;
  }

  async handleToken(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    let token: string;
    if (
      'text' in ctx.message &&
      ctx.message.text.match(/^\d+:[\da-zA-Z\-_]+$/m)
    ) {
      token = ctx.message.text;
    } else {
      // await ctx.reply(this.i18n.t('mandatory-subscribe.message.enterLink', {lang: user.lang}));
      return null;
    }
    return token;
  }

  async handleChannelId(
    ctx: IWizardContext<AddSponsorState, Update.MessageUpdate<Message>>,
  ) {
    const { user } = ctx;
    let channelId: number;
    if (
      'forward_origin' in ctx.message &&
      ctx.message.forward_origin.type === 'channel'
    ) {
      channelId = ctx.message.forward_origin.chat.id;
    } else if (
      'forward_origin' in ctx.message &&
      ctx.message.forward_origin.type === 'chat'
    ) {
      channelId = ctx.message.forward_origin.sender_chat.id;
    } else if ('text' in ctx.message && ctx.message.text.match(/\d+/)) {
      channelId = +ctx.message.text;
    } else {
      // await ctx.reply(this.i18n.t('mandatory-subscribe.message.enterChannelId', {lang: user.lang}));
      return null;
    }
    return channelId;
  }

  async handleTitle(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    let title: string;
    if ('text' in ctx.message) {
      title = ctx.message.text;
    } else {
      await ctx.reply(
        this.i18n.t('mandatory-subscribe.message.enterTitle', {
          lang: user.lang,
        }),
      );
      return false;
    }
    return title;
  }

  async handleName(ctx: IWizardContext<AddSponsorState>) {
    const { user } = ctx;
    let name: string;
    if ('text' in ctx.message) {
      name = ctx.message.text;
    } else {
      await ctx.reply(
        this.i18n.t('mandatory-subscribe.message.enterTitle', {
          lang: user.lang,
        }),
      );
      return false;
    }
    return name;
  }

  async getChat(chatId: number) {
    const chat = await this.telegramService.getChat(
      this.configService.get('BOT_TOKEN'),
      chatId,
    );
    return chat;
  }

  async getMe(token?: string) {
    const me = await this.telegramService.getMe(
      token ?? this.configService.get('BOT_TOKEN'),
    );
    return me;
  }

  async getBotUsername(token?: string) {
    const me = await this.telegramService.getMe(
      token ?? this.configService.get('BOT_TOKEN'),
    );
    return me.username;
  }
}
