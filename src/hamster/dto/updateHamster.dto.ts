import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { HamsterSettings } from '../hamster.interface';

export class UpdateHamsterDto implements HamsterSettings {
  @IsBoolean()
  @IsOptional()
  miniGame: boolean;

  @IsBoolean()
  @IsOptional()
  tilesMiniGame: boolean;

  @IsBoolean()
  @IsOptional()
  dailyCombo: boolean;

  @IsBoolean()
  @IsOptional()
  dailyCipher: boolean;

  @IsBoolean()
  @IsOptional()
  dailyRewards: boolean;

  @IsBoolean()
  @IsOptional()
  autoUpgrade: boolean;

  @IsBoolean()
  @IsOptional()
  autoTap: boolean;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumBalanceCoins: number;

  @IsBoolean()
  @IsOptional()
  ridingExtrimePromo: boolean;
}
