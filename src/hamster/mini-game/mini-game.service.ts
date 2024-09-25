import {
  HttpException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Hamster } from 'src/entities/typeorm/hamster.entity';
import { Repository } from 'typeorm';
import { WebshareProxyService } from 'src/webshare-proxy/webshare-proxy.service';
import { sleep } from 'src/common/helpers/app.helpers';
import { InjectRepository } from '@nestjs/typeorm';
import { Config, MiniGameConfig } from '../hamster.interface';
import { HamsterService } from '../hamster.service';

@Injectable()
export class MiniGameService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MiniGameService.name);
  private miniGameConfig: MiniGameConfig | undefined;
  constructor(
    private readonly hamsterService: HamsterService,
    @InjectRepository(Hamster)
    private readonly hamsterRepository: Repository<Hamster>,
    private readonly proxyService: WebshareProxyService,
  ) {}

  onApplicationBootstrap() {
    setImmediate(this.refreshMiniGame.bind(this));
  }

  getLevelConfig() {
    if (!this.miniGameConfig) {
      throw new HttpException('try later', 500);
    }
    return this.miniGameConfig;
  }

  @Cron(CronExpression.EVERY_DAY_AT_8PM)
  async refreshMiniGame() {
    const hamster = await this.hamsterRepository
      .createQueryBuilder()
      .select()
      .where({
        isActive: true,
      })
      .orderBy('random()')
      .getOne();

    if (!hamster) {
      this.logger.error(`not found any active hamster!`);
      return;
    }

    const proxyAgent = await this.proxyService.getProxyAgentById(
      +hamster.userId,
    );

    if (!proxyAgent) {
      this.logger.error(`not found any proxy agent!`);
      return;
    }

    this.logger.debug(
      `[Hamster id: ${hamster.userId}]: selected proxy ${proxyAgent.proxy.host}:${proxyAgent.proxy.port}`,
    );

    let config: Config,
      count: number = 0;
    while (true) {
      count++;
      config = await this.hamsterService.config({ ...hamster, proxyAgent });
      if (
        config.dailyKeysMiniGames.Candles.levelConfig !==
          this.miniGameConfig?.levelConfig ||
        count > 20
      ) {
        break;
      }
      await sleep(1000 * count);
    }

    this.miniGameConfig = {
      levelConfig: config.dailyKeysMiniGames.Candles.levelConfig,
      startDate: config.dailyKeysMiniGames.Candles.startDate,
    };
    this.logger.debug(
      `[Hamster id: ${hamster.userId}]: set up new mini-game config: ${JSON.stringify(this.miniGameConfig)}`,
    );
  }
}
