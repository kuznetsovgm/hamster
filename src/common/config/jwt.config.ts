import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { AppConfig } from 'src/app.interface';

export const getJWTConfig = async (
  configService: ConfigService<AppConfig>,
): Promise<JwtModuleOptions> => {
  const key = configService.getOrThrow('JWT_SECRET');
  return {
    secret: key,
    signOptions: { expiresIn: '7d' },
  };
};
