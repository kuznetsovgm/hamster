import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  Chat,
  ChatMember,
  ResponseParameters,
  User,
} from 'telegraf/typings/core/types/typegram';

const DDEFAULT_TELEGRAM_API_URL = 'https://api.telegram.org/';

interface ErrorPayload {
  error_code: number;
  description: string;
  parameters?: ResponseParameters;
}
interface TelegramResponseSuccess<T> {
  ok: true;
  result: T;
}
interface TelegramResponseError extends ErrorPayload {
  ok: false;
}
type TelegramResponse<T> = TelegramResponseSuccess<T> | TelegramResponseError;

@Injectable()
export class TelegramService {
  private tgApi: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpServis: HttpService,
  ) {
    this.tgApi =
      this.configService.get('TELEGRAM_API_URL') || DDEFAULT_TELEGRAM_API_URL;
  }

  async call<T = any>(method: string, body?: any, token?: string): Promise<T> {
    const url = new URL(`/bot${token}/${method}`, this.tgApi);
    const res = await firstValueFrom(
      this.httpServis.post<TelegramResponse<T>>(url.toString(), body),
    )
      .then((res) => res.data.ok && res.data.result)
      .catch((e) => {
        const err =
          e.status >= 500
            ? {
                description: e.response.status,
                error_code: e.response.statusText,
                ok: false,
              }
            : e.response.data;
        throw err;
      });
    return res;
  }

  async getChatMember(token: string, chat_id: number, user_id: number) {
    const res = await this.call<ChatMember>(
      this.getChatMember.name,
      {
        user_id,
        chat_id,
      },
      token,
    );
    return res;
  }

  async getChat(token: string, chat_id: number) {
    const res = await this.call<Chat>(
      this.getChat.name,
      {
        chat_id,
      },
      token,
    );
    return res;
  }

  async getMe(token: string) {
    const res = await this.call<User>(this.getMe.name, {}, token);
    return res;
  }
}
