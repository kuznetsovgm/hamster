// import { ConfigService } from "@nestjs/config";
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as pg from 'pg';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as path from 'path';

export const DATABASE_CONFIG_TOKEN = 'database';

export default registerAs(DATABASE_CONFIG_TOKEN, (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    driver: pg,
    schema: process.env.DB_SCHEMA,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? +process.env.DB_PORT : undefined,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    namingStrategy: new SnakeNamingStrategy(),
    logging:
      process.env.DB_LOG_LEVEL === 'debug'
        ? 'all'
        : ['error', 'schema', 'migration'],
    entities: [path.resolve(`${__dirname}/../../**/**.{entity,view}.{ts,js}`)],
    migrations: ['../migrations/*{.ts,.js}'],
  };
});
