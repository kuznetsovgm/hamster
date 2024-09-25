import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { getJWTConfig } from 'src/common/config/jwt.config';
import { redisIoProvider } from './providers/redis-io.provider';
import { AuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJWTConfig,
    }),
  ],
  providers: [AuthService, RolesGuard, AuthGuard, redisIoProvider],
  controllers: [AuthController],
  exports: [JwtModule, AuthService, AuthGuard],
})
export class AuthModule {}
