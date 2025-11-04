import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

function genCid(): string {
  // fallback if uuid not installed
  try {
    return uuidv4();
  } catch {
    return `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    let cid = (req.headers['x-correlation-id'] || req.headers['X-Correlation-Id']) as string | undefined;
    if (!cid) {
      cid = genCid();
      req.headers['x-correlation-id'] = cid;
    }
    res.setHeader('x-correlation-id', cid);
    return next.handle();
  }
}