import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import type { Request, Response } from 'express';

@Injectable()
export class SimpleLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction ) {
    console.log(`Request masuk method: ${req.method}, url: ${req.originalUrl}`);
    next();
  }
}
