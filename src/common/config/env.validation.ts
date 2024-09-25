import { Type, plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsIP,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { AppConfig, Environment } from 'src/app.interface';

class EnvironmentVariables implements AppConfig {
  @IsString()
  BOT_USERNAME: string;

  @IsString()
  BOT_TOKEN: string;

  @Type(() => JSON.parse)
  @IsString({ each: true })
  @IsOptional()
  LANGS_TO_DROP: string[];

  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  HOST_IP: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  @IsOptional()
  AUTOMETRICS_PORT: number;

  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  APP_PORT: number = 3000;

  @IsString()
  REDIS_HOST: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsString()
  REDIS_USER: string = '';

  @IsString()
  REDIS_PASSWORD: string = '';

  @IsUrl({ require_protocol: true })
  HAMSTER_API: string;

  @IsString()
  WEBSHARE_API_TOKEN: string;

  @IsString()
  @MinLength(32)
  @MaxLength(128)
  JWT_SECRET: string;

  @IsString()
  GAME_PROMO_API: string;

  @Type(() => Number)
  @IsNumber()
  MAX_NEW_PROMO_CODES_COUNT: number;

  @Type(() => Number)
  @IsNumber()
  FETCH_PROMO_CODES_THREADS_COUNT: number;

  @Type(() => Number)
  @IsNumber()
  REGISTER_EVENT_INTERVAL_MS: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  SHAVE_HAMSTERS_THREADS_COUNT: number;

  @Type(() => JSON.parse)
  @IsString({ each: true })
  SMART_PROXIES_LIST: string[];

  @IsString()
  @IsOptional()
  PROXY_SERVICE: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
