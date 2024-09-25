import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RawAxiosRequestHeaders } from 'axios';
import { firstValueFrom } from 'rxjs';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { AppConfig } from 'src/app.interface';
import {
  LoginClientRes,
  CreateCodeData,
  CreateCodeRes,
  LoginClientData,
  PromoConfig,
  RegisterEventData,
  RegisterEventRes,
} from './riding-extrime-promo.interface';
import { v4 } from 'uuid';
import { randomInt, sleep } from 'src/common/helpers/app.helpers';
import { GET_PROMO_CODE_INTERVAL_HOURS } from './riding-extrime-promo.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { WebshareProxyService } from 'src/webshare-proxy/webshare-proxy.service';
import { PromoCode } from 'src/entities/typeorm/promoCode.entity';
import { add, isAfter, sub } from 'date-fns';
import { PROMO_APPS } from '../hamster.constants';

@Injectable()
export class RidingExtrimePromoService implements OnApplicationBootstrap {
  private readonly logger = new Logger('RidingExtrimPromoService');
  private readonly api: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AppConfig>,
    private readonly proxyService: WebshareProxyService,
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
  ) {
    const url = configService.getOrThrow<string>('GAME_PROMO_API');
    this.api = url?.endsWith('/') ? url : `${url}/`;
  }

  onApplicationBootstrap() {
    // setImmediate(this.collectPromoCodes.bind(this));
  }

  private async generatePromoCodes(
    promoId: string,
    proxyAgents: SocksProxyAgent[],
  ): Promise<void> {
    const appConfig = PROMO_APPS[promoId];
    await Promise.allSettled(
      proxyAgents.map(async (proxyAgent, i) => {
        await sleep(i * 1000);
        const { promoCode } = await this.getPromocode({
          proxyAgent,
          promoId: promoId,
          appToken: appConfig.appToken,
          registerEventDelay: appConfig.registerEventDelay,
          loginClientDelay: appConfig.loginClientDelay,
          appName: appConfig.appName,
        });
        if (promoCode?.length === 0) {
          return;
        }
        await this.promoCodeRepository.save({ promoCode, promoId });
      }),
    );
  }
  private async collectPromoCodes() {
    const maxCodesCount = +this.configService.get(
      'MAX_NEW_PROMO_CODES_COUNT',
      500,
    );
    const threadsCount = +this.configService.get(
      'FETCH_PROMO_CODES_THREADS_COUNT',
      5,
    );
    const proxyAgents = await Promise.all(
      Array(threadsCount)
        .fill(0)
        .map((_, i) => this.proxyService.getProxyAgentById(i)),
    );
    const promoIds = Object.keys(PROMO_APPS);
    promoIds.forEach(async (promoId, promoIndex) => {
      while (true) {
        const count = await this.getNewPromocodesCount(promoId);
        if (count <= maxCodesCount) {
          this.generatePromoCodes(promoId, proxyAgents);
        }
        await sleep(120000);
      }
    });
  }

  getPromosCount(): number {
    return Object.keys(PROMO_APPS).length;
  }

  async isPromoCodeAvailableByTime(userId: number) {
    const count = await this.promoCodeRepository.count({ where: { userId } });
    if (!count) {
      return true;
    }
    const last = await this.promoCodeRepository.findOne({
      where: { userId: userId },
      order: { updatedAt: 'DESC' },
    });
    const lastPromoCodeDate = sub(last.updatedAt, {
      minutes: new Date().getTimezoneOffset(),
    });
    const availableAfter = add(lastPromoCodeDate, {
      hours: GET_PROMO_CODE_INTERVAL_HOURS,
    });

    return isAfter(new Date(), availableAfter);
  }
  async getNewPromocode(): Promise<PromoCode[]> {
    // return await this.promoCodeRepository.findOne({
    //   where: { userId: IsNull() },
    // });
    return await this.promoCodeRepository
      .createQueryBuilder()
      .select()
      .where({ userId: IsNull() })
      .distinctOn(['promo_id'])
      .getMany();
  }
  async markPromocodeAsUsed(promocodeId: number, userId: number) {
    return await this.promoCodeRepository.update(
      {
        id: promocodeId,
      },
      { userId },
    );
  }
  async getNewPromocodesCount(promoId: string) {
    return await this.promoCodeRepository.count({
      where: { userId: IsNull(), promoId },
    });
  }

  private async callApi<T>(
    method: string,
    proxyAgent: SocksProxyAgent,
    body?: any,
    authToken?: string,
  ) {
    this.logger.debug(
      `call api: method - ${method}, body - ${JSON.stringify(body)}, proxy: ${proxyAgent.proxy.host}:${proxyAgent.proxy.port}`,
    );
    let headers: RawAxiosRequestHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      Host: 'api.gamepromo.io',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-A528B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.3',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const { data } = await firstValueFrom(
      this.httpService.post<T>(`${this.api}${method}`, body, {
        headers,
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent,
        timeout: 120000,
      }),
    ).catch((e) => {
      this.logger.error(
        `method: ${method}, proxy host: ${proxyAgent.proxy.host}:${proxyAgent.proxy.port}, ${JSON.stringify(e.response?.data ?? e.message)}`,
      );
      if (!e.response?.data) {
        e;
      }
      throw e;
    });
    return data;
  }

  private generateClientId(): string {
    // "1722170633127-4191162372580188634"
    // const n1 = randomInt(1000000000000, 9999999999999);
    // const n2_1 = randomInt(1000000000, 9999999999);
    // const n2_2 = randomInt(100000000, 999999999);
    // return `${n1}-${n2_1}${n2_2}`;
    return v4();
  }

  private async loginClient(
    data: Partial<LoginClientData>,
    proxyAgent: SocksProxyAgent,
  ) {
    const clientId = data.clientId ?? this.generateClientId();
    const { clientToken } = await this.callApi<LoginClientRes>(
      'promo/login-client',
      proxyAgent,
      {
        appToken: data.appToken,
        clientOrigin: 'android',
        clientId: data.clientId ?? this.generateClientId(),
      } satisfies LoginClientData,
    );
    return { clientToken, clientId };
  }

  private async registerEvent(
    data: Pick<RegisterEventData, 'promoId'>,
    proxyAgent: SocksProxyAgent,
    clientToken: string,
  ) {
    return await this.callApi<RegisterEventRes>(
      'promo/register-event',
      proxyAgent,
      {
        promoId: data.promoId,
        eventId: v4(),
        eventOrigin: 'undefined',
        eventType: 'undefined',
      } satisfies RegisterEventData,
      clientToken,
    );
  }

  private async createCode(
    data: CreateCodeData,
    proxyAgent: SocksProxyAgent,
    clientToken: string,
  ) {
    return await this.callApi<CreateCodeRes>(
      'promo/create-code',
      proxyAgent,
      data,
      clientToken,
    );
  }

  async getPromocode({
    proxyAgent,
    appToken,
    promoId,
    appName,
    clientId: clientIdOrUndefined,
    registerEventDelay = 60000,
    loginClientDelay = registerEventDelay,
  }: PromoConfig): Promise<CreateCodeRes | undefined> {
    // const delay = +this.configService.get(
    //   'REGISTER_EVENT_INTERVAL_MS',
    //   30_000,
    // );
    const { clientToken, clientId } = await this.loginClient(
      { appToken, clientId: clientIdOrUndefined },
      proxyAgent,
    );
    this.logger.debug(
      `[promoId:${promoId}|clientId:${clientId}|${appName}]: sleep ${loginClientDelay}ms after login, proxy: ${proxyAgent.proxy.host}:${proxyAgent.proxy.port}`,
    );
    await sleep(loginClientDelay);
    let count = 0;
    while (count < 50) {
      const res = await this.registerEvent(
        { promoId },
        proxyAgent,
        clientToken,
      ).catch((e) => {});
      if (res && res.hasCode) {
        break;
      }
      count++;
      this.logger.debug(
        `[promoId:${promoId}|clientId:${clientId}|${appName}]: sleep ${registerEventDelay}ms before register next event [${count}], proxy: ${proxyAgent.proxy.host}:${proxyAgent.proxy.port}`,
      );
      await sleep(registerEventDelay);
    }
    const { promoCode } = await this.createCode(
      { promoId },
      proxyAgent,
      clientToken,
    );
    return {
      promoCode,
      clientToken,
      clientId,
    };
  }
}
