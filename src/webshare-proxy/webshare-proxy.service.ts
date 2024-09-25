import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { WebshareProxyList } from './webshare-proxy.interface';
import { AppConfig } from 'src/app.interface';
import { randomInt, sleep } from 'src/common/helpers/app.helpers';
import { InjectRedisIOProvider } from './providers/redis-io.provider';
import { SocksProxyAgent } from 'socks-proxy-agent';

const WEBSHARE_PROXIES_KEY = 'webshare_proxies';

@Injectable()
export class WebshareProxyService {
  private readonly smartProxiesList: string[];
  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly httpService: HttpService,
    @InjectRedisIOProvider() private readonly redisIo: Redis,
  ) {
    this.smartProxiesList = JSON.parse(configService.get('SMART_PROXIES_LIST'));
    this.smartProxiesList;
  }

  private onApplicationBootstrap() {
    setImmediate(this.cycle.bind(this));
  }

  private async fetchProxies() {
    const { data } = await firstValueFrom(
      this.httpService.get<WebshareProxyList>(
        'https://proxy.webshare.io/api/v2/proxy/list/?page=1&page_size=250&mode=direct',
        {
          headers: {
            Authorization: `Token ${this.configService.getOrThrow('WEBSHARE_API_TOKEN')}`,
          },
        },
      ),
    );
    return data;
  }

  private async cacheProxies() {
    const proxyList = await this.fetchProxies();
    const proxies = proxyList.results
      .sort((l, r) => l.id.localeCompare(r.id))
      .map<string>(
        (p) => `${p.username}:${p.password}@${p.proxy_address}:${p.port}`,
      );
    const multi = this.redisIo.multi();
    multi.del(WEBSHARE_PROXIES_KEY);
    multi.lpush(WEBSHARE_PROXIES_KEY, ...proxies);
    await multi.exec();
  }

  private async getWSProxyAgentByHamsterId(
    hid: number,
  ): Promise<SocksProxyAgent | null> {
    const length = await this.redisIo.llen(WEBSHARE_PROXIES_KEY);
    if (!length) {
      return null;
    }
    const index = hid % length;
    const proxyString = await this.redisIo.lindex(WEBSHARE_PROXIES_KEY, index);
    const agent = new SocksProxyAgent(`socks5://${proxyString}`, {
      timeout: 60000,
    });
    return agent;
  }

  private async getSPProxyAgentByHamsterId(
    hid: number,
  ): Promise<SocksProxyAgent | null> {
    const length = this.smartProxiesList.length;
    if (!length) {
      return null;
    }
    const index = hid % length;
    const proxyString = this.smartProxiesList[index];
    const agent = new SocksProxyAgent(`socks5://${proxyString}`, {
      timeout: 60000,
    });
    return agent;
  }

  async getProxyAgentById(id: number): Promise<SocksProxyAgent | null> {
    if (this.configService.get('PROXY_SERVICE') === 'smartproxy') {
      return await this.getSPProxyAgentByHamsterId(id);
    }
    return await this.getWSProxyAgentByHamsterId(id);
  }

  private async cycle() {
    while (1) {
      await this.cacheProxies();
      const delay = randomInt(
        3600000, // 1 hour
        5400000, // 1,5 hours
      );
      await sleep(delay);
    }
  }
}
