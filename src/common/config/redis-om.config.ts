import { ConfigService } from '@nestjs/config';
import { RedisOmModuleOptions } from 'nestjs-redis-om';
import { AppConfig } from 'src/app.interface';

export const getRedisOmConfig = async (
  configService: ConfigService<AppConfig>,
): Promise<RedisOmModuleOptions> => {
  const [user, password, host, port] = [
    configService.get('REDIS_USER'),
    configService.get('REDIS_PASSWORD'),
    configService.get('REDIS_HOST'),
    configService.get('REDIS_PORT'),
  ];
  return {
    url: `redis://${user}:${password}@${host}:${port}`,
  };
};
