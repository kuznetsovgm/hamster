import { Module } from '@nestjs/common';
import { WebshareProxyService } from './webshare-proxy.service';
import { HttpModule } from '@nestjs/axios';
import { redisIoProvider } from './providers/redis-io.provider';

@Module({
  imports: [HttpModule],
  providers: [WebshareProxyService, redisIoProvider],
  exports: [WebshareProxyService],
})
export class WebshareProxyModule {}
