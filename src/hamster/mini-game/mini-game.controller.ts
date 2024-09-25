import { Controller, Get, Header, Req, Res } from '@nestjs/common';
import { MiniGameService } from './mini-game.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('mini-game')
export class MiniGameController {
  constructor(
    private readonly miniGameService: MiniGameService,
    private httpService: HttpService,
  ) {}

  @Get('level-config')
  getLevelConfig() {
    return this.miniGameService.getLevelConfig();
  }

  @Get()
  @Header(
    'Content-Security-Policy',
    "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
  )
  async getMiniGame() {
    return (
      await firstValueFrom(
        this.httpService.get(
          `https://hamsterkombatgame.io/games/UnblockPuzzle/?v`,
        ),
      )
    ).data;
  }
}
