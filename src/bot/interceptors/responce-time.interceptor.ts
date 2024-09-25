import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
    private logger = new Logger(ResponseTimeInterceptor.name);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = Date.now();
        return next
            .handle()
            .pipe(tap(() => this.logger.verbose(`Response time: ${Date.now() - start}ms`)));
    }
}