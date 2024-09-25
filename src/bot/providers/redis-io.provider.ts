import { Inject, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export type RedisIOClient = Redis;
export const REDIS_IO_CLIENT = Symbol('redis-io-client');
export const InjectRedisIOProvider: () => ReturnType<
  typeof Inject<RedisIOClient>
> = () => Inject(REDIS_IO_CLIENT);

export const redisIoProvider: Provider = {
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<RedisIOClient> => {
    const redis = new Redis({
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      username: configService.get('REDIS_USER'),
      password: configService.get('REDIS_PASSWORD'),
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });
    await redis.connect();
    return redis;
  },
  provide: REDIS_IO_CLIENT,
};
