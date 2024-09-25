export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export interface AppConfig {
  HOST_IP: string;
  APP_PORT: number;
  NODE_ENV: Environment;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_USER?: string;
  REDIS_PASSWORD?: string;
  AUTOMETRICS_PORT?: number;
  HAMSTER_API: string;
  WEBSHARE_API_TOKEN: string;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  BOT_USERNAME: string;
  BOT_TOKEN: string;
  GAME_PROMO_API: string;
  SHAVE_HAMSTERS_THREADS_COUNT?: number;
  MAX_NEW_PROMO_CODES_COUNT: number;
  FETCH_PROMO_CODES_THREADS_COUNT: number;
  REGISTER_EVENT_INTERVAL_MS: number;
  SMART_PROXIES_LIST: string[];
  LANGS_TO_DROP?: string[];
  PROXY_SERVICE?: string;
}
