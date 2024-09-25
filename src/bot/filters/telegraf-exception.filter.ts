import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegrafExceptionFilter.name);
  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    this.logger.error(exception.message);
  }
}
