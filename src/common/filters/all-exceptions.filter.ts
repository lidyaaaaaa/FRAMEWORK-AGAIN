import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionHandler');

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorMessage: string | object = 'Terjadi kesalahan internal pada server kami.';

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      errorMessage =
        typeof errorResponse === 'object' && errorResponse !== null
          ? (errorResponse as any).message || errorResponse
          : errorResponse;
    } else if (exception instanceof Error) {
      this.logger.error(
        `CRITICAL pada [${request.method}] ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    this.logger.warn(
      `[${request.method}] ${request.url} | Status: ${status} | Error: ${JSON.stringify(errorMessage)}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: errorMessage,
    });
  }
}
