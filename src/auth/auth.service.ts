import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { JWTUser, LoginToken } from './auth.interface';
import { v4 } from 'uuid';
import { InjectRedisIOProvider } from './providers/redis-io.provider';
import { User } from 'src/entities/typeorm/user.entity';
import { sleep } from 'src/common/helpers/app.helpers';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/app.interface';
import { SITE_LOGIN_PAYLOAD_STARTS } from 'src/bot/bot.constants';

const LOGIN_TOKEN_LIST_KEY = 'login_token_list';
const JWT_TOKEN_KEY_PREFIX = 'jwt';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRedisIOProvider() private readonly redisIo: Redis,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async createLoginToken(): Promise<LoginToken> {
    const loginToken = `${SITE_LOGIN_PAYLOAD_STARTS}${v4()}`;
    await this.redisIo.sadd(LOGIN_TOKEN_LIST_KEY, loginToken);
    return {
      loginToken,
      botUsername: this.configService.getOrThrow('BOT_USERNAME'),
    };
  }

  async signIn(
    { loginToken }: Omit<LoginToken, 'botUsername'>,
    user: User,
  ): Promise<string> {
    const isTokenExist = await this.redisIo.sismember(
      LOGIN_TOKEN_LIST_KEY,
      loginToken,
    );
    if (!isTokenExist) {
      throw new Error(`Login token ${loginToken} is not exists`);
    }
    const jwt = await this.jwtService.signAsync({
      id: user.id.toString(),
      role: user.role,
      firstName: user.first_name,
    } satisfies Omit<JWTUser, 'exp'>);
    await this.redisIo.set(
      `${JWT_TOKEN_KEY_PREFIX}:${loginToken}`,
      jwt,
      'EX',
      600, // 10 minutes
    );
    await this.redisIo.srem(LOGIN_TOKEN_LIST_KEY, loginToken);
    return jwt;
  }

  async checkLogin(loginToken: string): Promise<string | null> {
    const authToken = await this.redisIo.get(
      `${JWT_TOKEN_KEY_PREFIX}:${loginToken}`,
    );
    if (!authToken) {
      return null;
    }
    await this.redisIo.del(`${JWT_TOKEN_KEY_PREFIX}:${loginToken}`);
    return authToken;
  }

  async checkLoginLong(loginToken: string): Promise<string> {
    let counter = 0;
    while (counter < 20) {
      const authToken = await this.checkLogin(loginToken);
      if (authToken) {
        return authToken;
      }
      counter++;
      await sleep(5000);
    }
    return null;
  }

  // decodeJWT(token: string): JWTUser {
  //   return this.jwtService.decode(token) as JWTUser;
  // }
}
