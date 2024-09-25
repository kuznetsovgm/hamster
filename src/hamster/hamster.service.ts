import {
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hamster } from 'src/entities/typeorm/hamster.entity';
import { DeepPartial, MoreThanOrEqual, Repository } from 'typeorm';
import {
  Action,
  AuthResult,
  BoostsForBuyRes,
  BuyBoost,
  BuyTap,
  BuyUpgradeResult,
  CacheAction,
  CheckTask,
  CheckTaskRes,
  ClaimDailyKeysMiniGame,
  ClickerUser,
  Config,
  DailyCipher,
  GetPromosRes,
  HamsterWithProxy,
  InitParams,
  SelectExchange,
  StartDailyKeysMiniGame,
  StartKeysMiniGameRes,
  SyncResult,
  TasksList,
  UpgradeForBuy,
  UpgradesForBuy,
} from './hamster.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/app.interface';
import { RawAxiosRequestHeaders } from 'axios';
import { randomInt, sleep } from 'src/common/helpers/app.helpers';
import { InjectRedisIOProvider } from './providers/redis-io.provider';
import {
  MINI_GAME_SECRET_1,
  MINI_GAME_SECRET_2,
  PROMO_APPS,
} from './hamster.constants';
import { UserService } from 'src/bot/user/user.service';
import { WebshareProxyService } from 'src/webshare-proxy/webshare-proxy.service';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HamsterLog } from 'src/entities/typeorm/hamsterLog.entity';
import { RidingExtrimePromoService } from './riding-extrime-promo/riding-extrime-promo.service';
import { hoursToSeconds } from 'date-fns';
import { createHash } from 'crypto';

const LAST_CYCLE_DATE_KEY = 'last_cycle_date';
const HAMSTER_LOG_KEY = 'hamster_log';

@Injectable()
export class HamsterService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HamsterService.name);
  private readonly api: string;
  constructor(
    @InjectRepository(Hamster)
    private readonly hamsterRepository: Repository<Hamster>,
    @InjectRepository(HamsterLog)
    private readonly hamsterLogRepository: Repository<HamsterLog>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AppConfig>,
    @InjectRedisIOProvider() private readonly redisIo: Redis,
    private readonly userService: UserService,
    private readonly proxyService: WebshareProxyService,
    private readonly ridingExtrimeService: RidingExtrimePromoService,
  ) {
    const url = configService.getOrThrow<string>('HAMSTER_API');
    this.api = url?.endsWith('/') ? url : `${url}/`;
  }

  onApplicationBootstrap() {
    setImmediate(this.cycle.bind(this));
  }

  getUserIdFromTgWebAppData(tgWebAppData: string) {
    return this.urlSafeDecode(tgWebAppData)?.match(/(?<=user={"id":)\d+/)?.[0];
  }

  async createHamster(
    iframeUrl: string,
    id: number,
    checkUserId: boolean = true,
  ) {
    const hash = iframeUrl.replace(/.*(?=#)/, '');
    const initParams = this.urlParseHashParams(hash);
    const hamsterId = +this.getUserIdFromTgWebAppData(initParams.tgWebAppData);
    if (checkUserId && hamsterId !== id) {
      throw new ForbiddenException();
    }
    const check = await this.hamsterRepository.findOne({
      where: { userId: hamsterId },
    });
    if (check) {
      throw new HttpException(
        `Hamster ID:${hamsterId} already registered`,
        400,
      );
    }
    await this.userService.create({ id: hamsterId }).catch((e) => {
      this.logger.log(e);
    });
    const proxyAgent = await this.proxyService.getProxyAgentById(+hamsterId);
    const auth = await this.auth(initParams.tgWebAppData, proxyAgent);
    const hamster = this.hamsterRepository.create({
      token: auth.authToken,
      userId: hamsterId,
      iframeSrc: iframeUrl,
    });
    await this.hamsterRepository.save(hamster);
    this.shaveHamster({ ...hamster, proxyAgent }).catch((err) =>
      this.logger.error(err),
    );
    return hamster;
  }

  async getHamster(id: number): Promise<Hamster | null> {
    return await this.hamsterRepository.findOne({
      where: { userId: id },
    });
  }

  async updateHamster(id: number, update: DeepPartial<Hamster>) {
    const hamster = await this.getHamster(id);
    if (!hamster) {
      return;
    }
    await this.hamsterRepository.update(
      {
        userId: id,
      },
      { ...update, settings: { ...hamster.settings, ...update.settings } },
    );
    if (update.settings) {
      await this.cacheLog(id, {
        method: 'update-settings',
        data: { ...hamster.settings, ...update.settings },
      });
    }
    return await this.getHamster(id);
  }

  async getHamsterLog(
    id: number,
    take: number = 100,
    skip: number = 0,
    all: boolean = false,
  ): Promise<HamsterLog[] | null> {
    // return await this.hamsterLogRepository.find({
    //   where: {
    //     hamsterId: id,
    //     action: Raw(
    //       (alias) =>
    //         `${alias
    //           .split('.')
    //           .map((a) => `"${a}"`)
    //           .join('.')}->>'method' IN (:...methods)`,
    //       {
    // methods: [
    //   'buy-upgrade',
    //   'tap',
    //   'claim-daily-cipher',
    //   'check-task',
    //   'select-exchange',
    // ],
    //       },
    //     ),
    //   },
    //   order: { createdAt: 'DESC' },
    //   take,
    //   skip,
    // });

    const query = this.hamsterLogRepository
      .createQueryBuilder('HamsterLog')
      .where('HamsterLog.hamsterId = :id', { id: id })
      .orderBy('HamsterLog.createdAt', 'DESC')
      .take(take)
      .skip(skip);
    if (!all) {
      query.andWhere(`"HamsterLog".action->>'method' IN (:...methods)`, {
        methods: [
          'buy-upgrade',
          'tap',
          'claim-daily-cipher',
          'check-task',
          'select-exchange',
          'claim-daily-keys-minigame',
          'apply-promo',
          'buy-boost',
        ],
      });
    }
    return await query.getMany();
  }
  async persistLog(hamsterId: Hamster['userId']) {
    const actions = await this.redisIo.smembers(
      `${HAMSTER_LOG_KEY}:${hamsterId}`,
    );
    const entities = actions.map((a) => {
      const { timestamp, ...action } = JSON.parse(a) as Action;
      return this.hamsterLogRepository.create({
        hamsterId,
        action,
        createdAt: new Date(timestamp),
      });
    });
    await this.hamsterLogRepository.save(entities, { chunk: 10000 });
    await this.redisIo.del(`${HAMSTER_LOG_KEY}:${hamsterId}`);
  }
  async cacheLog(hamsterId: Hamster['userId'], action: CacheAction) {
    await this.redisIo.sadd(
      `${HAMSTER_LOG_KEY}:${hamsterId}`,
      JSON.stringify({ ...action, timestamp: Date.now() }),
    );
  }

  async auth(
    initData: InitParams['tgWebAppData'],
    proxyAgent: SocksProxyAgent,
  ): Promise<AuthResult> {
    const data = await this.callApi<AuthResult>(
      'auth/auth-by-telegram-webapp',
      this.getHeaders(),
      proxyAgent,
      {
        initDataRaw: initData,
      },
    );
    const userId = +this.getUserIdFromTgWebAppData(initData);
    await this.cacheLog(userId, { method: 'auth' });
    return data;
  }

  async sync(hamster: HamsterWithProxy): Promise<SyncResult> {
    const data = await this.callApi<SyncResult>(
      'interlude/sync',
      this.getHeaders(hamster),
      hamster.proxyAgent,
    );

    await this.cacheLog(hamster.userId, { method: 'sync' });
    return data;
  }

  async buyBoost(
    hamster: HamsterWithProxy,
    boost: Omit<BuyBoost, 'timestamp'>,
  ): Promise<SyncResult> {
    const data = await this.callApi<SyncResult>(
      'interlude/buy-boost',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      { ...boost, timestamp: Math.floor(Date.now() / 1000) },
    );

    await this.cacheLog(hamster.userId, { method: 'buy-boost', data: boost });
    return data;
  }

  async boostsForBuy(hamster: HamsterWithProxy): Promise<BoostsForBuyRes> {
    const data = await this.callApi<BoostsForBuyRes>(
      'interlude/boosts-for-buy',
      this.getHeaders(hamster),
      hamster.proxyAgent,
    );

    await this.cacheLog(hamster.userId, { method: 'boosts-for-buy' });
    return data;
  }

  async startKeysMiniGame(
    hamster: HamsterWithProxy,
    body: StartDailyKeysMiniGame,
  ): Promise<StartKeysMiniGameRes> {
    const data = await this.callApi<StartKeysMiniGameRes>(
      'interlude/start-keys-minigame',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      body,
    );

    await this.cacheLog(hamster.userId, {
      method: 'start-keys-minigame',
      data: body,
    });
    return data;
  }

  async claimDailyKeysMiniGame(
    hamster: HamsterWithProxy,
    body: ClaimDailyKeysMiniGame,
  ): Promise<StartKeysMiniGameRes> {
    const data = await this.callApi<StartKeysMiniGameRes>(
      'interlude/claim-daily-keys-minigame',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      body,
    );

    await this.cacheLog(hamster.userId, {
      method: 'claim-daily-keys-minigame',
      data: body,
    });
    return data;
  }

  async listTasks(hamster: HamsterWithProxy): Promise<TasksList> {
    const data = await this.callApi<TasksList>(
      'interlude/list-tasks',
      this.getHeaders(hamster),
      hamster.proxyAgent,
    );

    await this.cacheLog(hamster.userId, { method: 'list-tasks' });
    return data;
  }

  async checkTask(
    hamster: HamsterWithProxy,
    task: CheckTask,
  ): Promise<CheckTaskRes> {
    const data = await this.callApi<CheckTaskRes>(
      'interlude/check-task',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      task,
    );

    await this.cacheLog(hamster.userId, { method: 'check-task', data: task });
    return data;
  }

  async config(hamster: HamsterWithProxy): Promise<Config> {
    const data = await this.callApi<Config>(
      'interlude/config',
      this.getHeaders(hamster),
      hamster.proxyAgent,
    );

    await this.cacheLog(hamster.userId, { method: 'config' });
    return data;
  }

  async upgradesForBuy(hamster: HamsterWithProxy): Promise<UpgradesForBuy> {
    const data = await this.callApi<UpgradesForBuy>(
      'interlude/upgrades-for-buy',
      this.getHeaders(hamster),
      hamster.proxyAgent,
    );

    await this.cacheLog(hamster.userId, { method: 'upgrades-for-buy' });
    return data;
  }

  async getPromos(hamster: HamsterWithProxy): Promise<GetPromosRes> {
    const data = await this.callApi<GetPromosRes>(
      'interlude/get-promos',
      this.getHeaders(hamster),
      hamster.proxyAgent,
    );

    await this.cacheLog(hamster.userId, { method: 'get-promos' });
    return data;
  }

  async buyUpgrade(
    hamster: HamsterWithProxy,
    upgradeId: UpgradeForBuy['id'],
  ): Promise<BuyUpgradeResult> {
    const data = await this.callApi<BuyUpgradeResult>(
      'interlude/buy-upgrade',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      { upgradeId, timestamp: Date.now() },
    );
    await this.cacheLog(hamster.userId, {
      method: 'buy-upgrade',
      data: { upgradeId },
    });
    return data;
  }

  async tap(
    hamster: HamsterWithProxy,
    tap: Omit<BuyTap, 'timestamp'>,
  ): Promise<BuyUpgradeResult> {
    const data = await this.callApi<BuyUpgradeResult>(
      'interlude/tap',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      { ...tap, timestamp: Math.floor(Date.now() / 1000) },
    );
    await this.cacheLog(hamster.userId, {
      method: 'tap',
      data: { ...tap },
    });
    return data;
  }

  async selectExchange(
    hamster: HamsterWithProxy,
    exchange: SelectExchange,
  ): Promise<ClickerUser> {
    const data = await this.callApi<ClickerUser>(
      'interlude/select-exchange',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      exchange,
    );
    await this.cacheLog(hamster.userId, {
      method: 'select-exchange',
      data: exchange,
    });
    return data;
  }

  async claimDailyCipher(
    hamster: HamsterWithProxy,
    cipher: Pick<DailyCipher, 'cipher'>,
  ): Promise<SyncResult> {
    const data = await this.callApi<SyncResult>(
      'interlude/claim-daily-cipher',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      cipher,
    );
    await this.cacheLog(hamster.userId, {
      method: 'claim-daily-cipher',
      data: cipher,
    });
    return data;
  }

  async applyPromo(
    hamster: HamsterWithProxy,
    promoCode: string,
  ): Promise<SyncResult> {
    const data = await this.callApi<SyncResult>(
      'interlude/apply-promo',
      this.getHeaders(hamster),
      hamster.proxyAgent,
      { promoCode },
    );
    await this.cacheLog(hamster.userId, {
      method: 'apply-promo',
      data: { promoCode },
    });
    return data;
  }

  async callApi<T>(
    method: string,
    headers: RawAxiosRequestHeaders,
    proxyAgent: SocksProxyAgent,
    body?: any,
  ) {
    this.logger.debug(
      `call api: method - ${method}, body - ${JSON.stringify(body)}`,
    );
    const { data } = await firstValueFrom(
      this.httpService.post<T>(`${this.api}${method}`, body, {
        headers,
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent,
      }),
    );
    return data;
  }

  private getHeaders(hamster?: Hamster): RawAxiosRequestHeaders {
    const headers = {
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      Accept: '*/*',
      'Accept-Language': 'en-EU,en;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      Host: 'api.hamsterkombatgame.io',
      Origin: 'https://hamsterkombatgame.io',
      Pragma: 'no-cache',
      Referer: 'https://hamsterkombatgame.io/',
      'Sec-Ch-Ua':
        '"Not/A)Brand";v="99", "Google Chrome";v="99", "Chromium";v="99"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36',
    };
    if (hamster?.token) {
      headers['Authorization'] = `Bearer ${hamster.token}`;
    }
    return headers;
  }

  getMostProfitableUpgrade(
    {
      balanceDiamonds,
      upgrades,
      referralsCount,
      airdropTasks,
      id,
      earnPassivePerSec,
    }: ClickerUser,
    upgradesForBuy: UpgradeForBuy[],
  ): UpgradeForBuy | undefined {
    let mostProfitableUpgrade: UpgradeForBuy;
    for (const upgradeForBuy of upgradesForBuy) {
      if (upgradeForBuy.condition) {
        const { condition } = upgradeForBuy;
        if (
          condition._type === 'ByUpgrade' &&
          condition.level > upgrades[condition.upgradeId]?.level
        ) {
          continue;
        }
        if (
          condition._type === 'ReferralCount' &&
          condition.referralCount > referralsCount
        ) {
          continue;
        }
        if (
          condition._type === 'MoreReferralsCount' &&
          condition.moreReferralsCount >
            referralsCount -
              (upgrades[upgradeForBuy.id]?.snapshotReferralsCount ?? 0)
        ) {
          continue;
        }
        if (
          condition._type === 'SubscribeTelegramChannel' &&
          !airdropTasks.subscribe_telegram_channel?.completedAt
        ) {
          continue;
        }
      }
      const balanceIn24h =
        balanceDiamonds + earnPassivePerSec * hoursToSeconds(24);
      // if in 24 hours there is already enough money, then it’s better to wait
      if (balanceIn24h < upgradeForBuy.price) {
        continue;
      }
      if (
        upgradeForBuy.isExpired ||
        !upgradeForBuy.isAvailable ||
        (upgradeForBuy.cooldownSeconds ?? 0) > 60
      ) {
        continue;
      }

      if (!mostProfitableUpgrade) {
        mostProfitableUpgrade = upgradeForBuy;
        continue;
      }
      if (
        upgradeForBuy.profitPerHourDelta / upgradeForBuy.price >
        mostProfitableUpgrade.profitPerHourDelta / mostProfitableUpgrade.price
      ) {
        this.logger.debug(
          `[Hamster id: ${id}]: ${upgradeForBuy.id}: profitPerHourDelta / price = ${upgradeForBuy.profitPerHourDelta / upgradeForBuy.price}`,
        );
        mostProfitableUpgrade = upgradeForBuy;
        continue;
      }
    }
    return mostProfitableUpgrade;
  }

  async autoTap(
    hamster: HamsterWithProxy,
    interludeUser: ClickerUser,
  ): Promise<ClickerUser> {
    const count = randomInt(
      interludeUser.availableTaps * 0.9,
      interludeUser.availableTaps,
    );
    const refuelTaps = Math.floor(
      (Math.floor(Date.now() / 1000) - interludeUser.lastSyncUpdate) *
        interludeUser.tapsRecoverPerSec,
    );
    const availableTaps =
      Math.min(
        interludeUser.availableTaps + refuelTaps,
        interludeUser.maxTaps,
      ) - count;
    this.logger.debug(
      `[Hamster id: ${hamster.userId}]: Tap count: ${count}, available taps: ${availableTaps}`,
    );
    const res = await this.tap(hamster, {
      count,
      availableTaps,
    });
    interludeUser = res.interludeUser;
    return interludeUser;
  }

  async upgradeHamster(hamster: HamsterWithProxy, interludeUser: ClickerUser) {
    let upgradesForBuy = await this.upgradesForBuy(hamster);
    let counter = 0;
    while (counter < 20) {
      const mostProfitableUpgrade = this.getMostProfitableUpgrade(
        interludeUser,
        upgradesForBuy.upgradesForBuy,
      );
      if (
        !mostProfitableUpgrade ||
        interludeUser.balanceDiamonds - mostProfitableUpgrade.price <
          (hamster.settings.minimumBalanceCoins ?? 0)
      ) {
        break;
      }
      if (mostProfitableUpgrade.cooldownSeconds > 0) {
        this.logger.debug(
          `[Hamster id: ${hamster.userId}]: Sleep Before upgrade ${mostProfitableUpgrade.id} ${mostProfitableUpgrade.cooldownSeconds} sec.`,
        );
        await sleep(mostProfitableUpgrade.cooldownSeconds * 1000);
      }
      this.logger.debug(
        `[Hamster id: ${hamster.userId}]: Upgrade ${mostProfitableUpgrade.id}: profitPerHourDelta (${mostProfitableUpgrade.profitPerHourDelta}) / price (${mostProfitableUpgrade.price}) = ${mostProfitableUpgrade.profitPerHourDelta / mostProfitableUpgrade.price}`,
      );
      const res = await this.buyUpgrade(hamster, mostProfitableUpgrade.id);
      interludeUser = res.interludeUser;
      upgradesForBuy.dailyCombo = res.dailyCombo;
      upgradesForBuy.upgradesForBuy = res.upgradesForBuy;
      counter++;
      await sleep(randomInt(5000, 12000));
    }
    return interludeUser;
  }

  async tasks(
    hamster: HamsterWithProxy,
    interludeUser: ClickerUser,
  ): Promise<ClickerUser> {
    const taskList = await this.listTasks(hamster);
    const newTasks = taskList.tasks.filter((t) => !t.isCompleted);
    for (const task of newTasks) {
      try {
        const res = await this.checkTask(hamster, { taskId: task.id });
        interludeUser = res.interludeUser;
      } catch (e) {
        this.logger.error(
          `[Hamster id: ${hamster.userId}]: Error while complete task ${task} - ${JSON.stringify(e)}`,
        );
        return interludeUser;
      }
    }
    return interludeUser;
  }

  async selectBestExchange(
    hamster: HamsterWithProxy,
    interludeUser: ClickerUser,
    config: Config,
  ): Promise<ClickerUser | undefined> {
    const exchanges = config.clickerConfig?.exchanges;
    const exchange = exchanges?.reduce((prev, cur) =>
      cur.bonus > prev?.bonus ? cur : prev,
    );
    if (!exchange || exchange.id === interludeUser.exchangeId) {
      return interludeUser;
    }
    await this.selectExchange(hamster, { exchangeId: exchange.id });
    return interludeUser;
  }

  async dailyCipher(
    hamster: HamsterWithProxy,
    interludeUser: ClickerUser,
    config: Config,
  ): Promise<ClickerUser> {
    if (config.dailyCipher?.isClaimed) {
      return interludeUser;
    }
    try {
      const cipherEncoded = config.dailyCipher.cipher;
      const cipherDecoded = this.cipherDecode(cipherEncoded);
      const res = await this.claimDailyCipher(hamster, {
        cipher: cipherDecoded,
      });
      return res.interludeUser;
    } catch (e) {
      this.logger.error(
        `[Hamster id: ${hamster.userId}]: Error while claim daily cipher - ${JSON.stringify(e)}`,
      );
      return interludeUser;
    }
  }

  async gamesPromo(
    hamster: HamsterWithProxy,
    interludeUser: ClickerUser,
  ): Promise<ClickerUser> {
    const { promos, states } = await this.getPromos(hamster);
    for (const promo of promos) {
      const state = states?.find((state) => state.promoId === promo.promoId);
      const appConfig = PROMO_APPS[promo.promoId];

      if (
        !promo ||
        promo.blocked ||
        (state?.receiveKeysToday ?? 0) >= promo.keysPerDay ||
        !appConfig
      ) {
        continue;
      }
      try {
        const savedClientId = hamster.promoClientTokens?.[promo.promoId];
        const promoCode = await this.ridingExtrimeService.getPromocode({
          proxyAgent: hamster.proxyAgent,
          promoId: promo.promoId,
          appToken: appConfig.appToken,
          registerEventDelay: appConfig.registerEventDelay,
          loginClientDelay: appConfig.loginClientDelay,
          appName: appConfig.appName,
          clientId: savedClientId,
        });
        if (!promoCode) {
          continue;
        }
        const res = await this.applyPromo(hamster, promoCode.promoCode);
        if (!savedClientId || promoCode.clientId !== savedClientId) {
          await this.updateHamster(hamster.userId, {
            promoClientTokens: {
              ...hamster.promoClientTokens,
              [promo.promoId]: promoCode.clientId,
            },
          });
        }
        interludeUser = res.interludeUser;
        await sleep(60000);
      } catch (e) {
        this.logger.error(
          `[Hamster id: ${hamster.userId}]: Error while claim promo code - ${JSON.stringify(e.message)}`,
        );
      }
    }
    return interludeUser;
  }

  private getGameCipher(startNumber: number): string {
    const startNumberStr = startNumber.toString();
    const magicIndex = startNumber % (startNumberStr.length - 2);
    let res = '';
    for (let i = 0; i < startNumberStr.length; i++) {
      res += i === magicIndex ? '0' : Math.floor(Math.random() * 10).toString();
    }
    return res;
  }

  private generateHash(inputString: string): string {
    const hash = createHash('sha256');
    hash.update(inputString);
    const digest = hash.digest();
    return Buffer.from(digest).toString('base64');
  }

  async candlesMiniGame(
    hamster: HamsterWithProxy,
    interludeUser: ClickerUser,
    config: Config,
  ): Promise<ClickerUser> {
    if (
      config.dailyKeysMiniGames.Candles.isClaimed ||
      config.dailyKeysMiniGames.Candles.remainSecondsToNextAttempt > 0
    ) {
      return interludeUser;
    }
    try {
      const startMiniGame = await this.startKeysMiniGame(hamster, {
        miniGameId: 'Candles',
      });
      await sleep(randomInt(12000, 22000));
      const score = 0;
      const gameDate = new Date(config.dailyKeysMiniGames.Candles.startDate);
      const gameTimestamp = Math.trunc(gameDate.valueOf() / 1000);
      const cipherScore = (gameTimestamp + score) * 2;
      const number = this.getGameCipher(gameTimestamp);
      const sig = this.generateHash(
        `${MINI_GAME_SECRET_1}${cipherScore}${MINI_GAME_SECRET_2}`,
      );
      const str = `${number}|${interludeUser.id}|Candles|${cipherScore}|${sig}`;
      this.logger.debug(
        `[Hamster id: ${hamster.userId}]: claim daily keys mini game Candles - ${str}`,
      );
      const res = await this.claimDailyKeysMiniGame(hamster, {
        cipher: btoa(str),
        miniGameId: 'Candles',
      });
      return 'interludeUser' in res ? res?.interludeUser : interludeUser;
    } catch (e) {
      this.logger.error(
        `[Hamster id: ${hamster.userId}]: Error while claim daily keys mini game cipher - ${JSON.stringify(e.response?.data)}`,
      );
      return interludeUser;
    }
  }

  async tilesMiniGame(
    hamster: HamsterWithProxy,
    interludeUser: ClickerUser,
    config: Config,
  ): Promise<ClickerUser> {
    if (config.dailyKeysMiniGames.Tiles.isClaimed) {
      return interludeUser;
    }
    try {
      const startMiniGame = await this.startKeysMiniGame(hamster, {
        miniGameId: 'Tiles',
      });
      await sleep(randomInt(120000, 240000));
      const score = Math.min(
        randomInt(300, 600),
        config.dailyKeysMiniGames.Tiles.remainPoints ??
          config.dailyKeysMiniGames.Tiles.maxPoints ??
          0,
      );
      const date = new Date(config.dailyKeysMiniGames.Tiles.startDate);
      const gameTimestamp = Math.trunc(date.valueOf() / 1000);
      const cipherScore = (gameTimestamp + score) * 2;
      const number = this.getGameCipher(gameTimestamp);
      const sig = this.generateHash(
        `${MINI_GAME_SECRET_1}${cipherScore}${MINI_GAME_SECRET_2}`,
      );
      const str = `${number}|${interludeUser.id}|Tiles|${cipherScore}|${sig}`;
      this.logger.debug(
        `[Hamster id: ${hamster.userId}]: claim daily keys mini game Tiles - ${str} (score = ${score})`,
      );
      const res = await this.claimDailyKeysMiniGame(hamster, {
        cipher: btoa(str),
        miniGameId: 'Tiles',
      });
      return 'interludeUser' in res ? res?.interludeUser : interludeUser;
    } catch (e) {
      this.logger.error(
        `[Hamster id: ${hamster.userId}]: Error while claim daily keys mini game cipher - ${JSON.stringify(e.response?.data)}`,
      );
      return interludeUser;
    }
  }

  private cipherDecode(e: string) {
    const t = `${e.slice(0, 3)}${e.slice(4)}`;
    return atob(t);
  }

  async shaveHamster(hamster: HamsterWithProxy): Promise<void> {
    this.logger.debug(`[Hamster id: ${hamster.userId}]: start shaving`);
    try {
      let { interludeUser } = await this.sync(hamster);
      const config = await this.config(hamster);
      // if (hamster.settings.autoTap) {
      //   const canTap = interludeUser.availableTaps >= interludeUser.maxTaps * 0.2;
      //   // check boost
      //   const boosts = await this.boostsForBuy(hamster);
      //   const refuelTapsBoost = boosts.boostsForBuy?.find(
      //     (b) => b.id === REFUEL_TAPS_BOOST_ID,
      //   );

      //   const canBoost =
      //     refuelTapsBoost?.cooldownSeconds === 0 &&
      //     refuelTapsBoost.level <= refuelTapsBoost.maxLevel;
      //   if (canTap) {
      //     interludeUser = await this.autoTap(hamster, interludeUser) ?? interludeUser;
      //   }
      //   if (canBoost) {
      //     // buy boost
      //     interludeUser = (
      //       await this.buyBoost(hamster, { boostId: REFUEL_TAPS_BOOST_ID })
      //     ).interludeUser ?? interludeUser;
      //     interludeUser = await this.autoTap(hamster, interludeUser) ?? interludeUser;
      //   }
      // }
      // if (hamster.settings.dailyCipher) {
      //   interludeUser = await this.dailyCipher(hamster, interludeUser, config) ?? interludeUser;
      // }
      if (hamster.settings.dailyRewards) {
        interludeUser =
          (await this.selectBestExchange(hamster, interludeUser, config)) ??
          interludeUser;
        interludeUser =
          (await this.tasks(hamster, interludeUser)) ?? interludeUser;
      }
      if (hamster.settings.autoUpgrade) {
        interludeUser =
          (await this.upgradeHamster(hamster, interludeUser)) ?? interludeUser;
      }
      if (hamster.settings.miniGame) {
        interludeUser =
          (await this.candlesMiniGame(hamster, interludeUser, config)) ??
          interludeUser;
      }
      if (hamster.settings.tilesMiniGame) {
        interludeUser =
          (await this.tilesMiniGame(hamster, interludeUser, config)) ??
          interludeUser;
      }
      if (hamster.settings.ridingExtrimePromo) {
        interludeUser =
          (await this.gamesPromo(hamster, interludeUser)) ?? interludeUser;
      }
      await this.updateHamster(hamster.userId, {
        clickerUser: interludeUser,
      });
    } catch (e) {
      this.logger.error(e);
    }
    await this.persistLog(hamster.userId);
    this.logger.debug(`[Hamster id: ${hamster.userId}]: finnish shaving`);
  }

  private urlParseHashParams(locationHash: string): InitParams {
    locationHash = locationHash.replace(/^#/, '');
    var params: any = {};
    if (!locationHash.length) {
      return params;
    }
    if (locationHash.indexOf('=') < 0 && locationHash.indexOf('?') < 0) {
      params._path = this.urlSafeDecode(locationHash);
      return params;
    }
    var qIndex = locationHash.indexOf('?');
    if (qIndex >= 0) {
      var pathParam = locationHash.substr(0, qIndex);
      params._path = this.urlSafeDecode(pathParam);
      locationHash = locationHash.substr(qIndex + 1);
    }
    var query_params = this.urlParseQueryString(locationHash);
    for (var k in query_params) {
      params[k] = query_params[k];
    }
    return params;
  }

  private urlParseQueryString(queryString: string) {
    var params = {};
    if (!queryString.length) {
      return params;
    }
    var queryStringParams = queryString.split('&');
    var i, param, paramName, paramValue;
    for (i = 0; i < queryStringParams.length; i++) {
      param = queryStringParams[i].split('=');
      paramName = this.urlSafeDecode(param[0]);
      paramValue = param[1] == null ? null : this.urlSafeDecode(param[1]);
      params[paramName] = paramValue;
    }
    return params;
  }

  private urlSafeDecode(urlencoded: string) {
    try {
      urlencoded = urlencoded.replace(/\+/g, '%20');
      return decodeURIComponent(urlencoded);
    } catch (e) {
      return urlencoded;
    }
  }

  async main() {
    this.logger.debug(`start cycle`);
    let hamsters: Hamster[];
    let take = this.configService.get('SHAVE_HAMSTERS_THREADS_COUNT', 10);
    let skip = 0;
    do {
      this.logger.debug(`take next ${take} hamsters, skip ${skip}`);
      hamsters = await this.hamsterRepository.find({
        where: { isActive: true, payedUntil: MoreThanOrEqual(new Date()) },
        take,
        skip,
      });
      skip += take;
      await Promise.allSettled(
        hamsters.map(async (hamster) => {
          const proxyAgent = await this.proxyService.getProxyAgentById(
            +hamster.userId,
          );
          this.logger.debug(
            `[Hamster id: ${hamster.userId}]: selected proxy ${proxyAgent.proxy.host}:${proxyAgent.proxy.port}`,
          );
          await this.shaveHamster({ ...hamster, proxyAgent }).catch((err) =>
            this.logger.error(err),
          );
        }),
      );
    } while (hamsters.length === take);
  }

  async cycle() {
    let lastCycleDate = +(await this.redisIo.get(LAST_CYCLE_DATE_KEY));
    if (isNaN(lastCycleDate)) {
      lastCycleDate = Date.now();
    }
    while (1) {
      const delay = randomInt(
        lastCycleDate - Date.now() + 1800000,
        lastCycleDate - Date.now() + 2400000,
      );
      this.logger.debug(
        `sleep ${Math.round(delay / 1000 / 60)} minutes before next cycle starts`,
      );
      await sleep(delay);
      await this.main();
      lastCycleDate = Date.now();
      await this.redisIo.set(LAST_CYCLE_DATE_KEY, lastCycleDate);
    }
  }
}
