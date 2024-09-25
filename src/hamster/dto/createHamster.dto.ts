import { IsUrl } from 'class-validator';

export class CreateHamsterDto {
  @IsUrl({
    require_host: true,
    require_port: false,
    require_protocol: true,
    allow_underscores: true,
    protocols: ['https'],
    host_whitelist: [
      'hamsterkombat.io',
      'app.hamsterkombat.io',
      'hamsterkombatgame.io',
      'app.hamsterkombatgame.io',
    ],
  })
  src: string;
}
