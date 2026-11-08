import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


//definiisikan interceptor untuk transformasi response
export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
} 

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      //transformasi response menjadi format standar
      map((data) => ({
        success: true,
        statusCode,
        message: 'Request berhasil',
        data: data ?? null,
      })),
    );
  }
}
