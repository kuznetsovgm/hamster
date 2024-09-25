import { init } from '@autometrics/exporter-prometheus';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/app.interface';

export const AUTOMETRICS_PROVIDER = Symbol('autometrics_provider');
export const autometricsProvider: Provider = {
  provide: AUTOMETRICS_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<AppConfig>) =>
    init({
      port: configService.get('AUTOMETRICS_PORT'),
    }),
};
