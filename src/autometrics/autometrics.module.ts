import { Module } from '@nestjs/common';
import { autometricsProvider } from './providers/autometrics.provider';

@Module({
  providers: [autometricsProvider],
})
export class AutometricsModule {}
