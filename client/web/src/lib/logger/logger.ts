import type { NextRequest } from 'next/server';

const SENSITIVE_PATTERNS = [
  /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g, // JWT
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI API key
  /pk_[a-zA-Z0-9]{24}/g, // Stripe publishable key
  /sk_[a-zA-Z0-9]{24}/g, // Stripe secret key
  /Bearer [a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]*/g, // Bearer token
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
];

export function redactString(str: string): string {
  let redacted = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  return redacted;
}

export function redactObject(obj: any): any {
  if (typeof obj === 'string') {
    return redactString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }
  if (obj && typeof obj === 'object') {
    const redacted: any = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        redacted[key] = redactObject(obj[key]);
      }
    }
    return redacted;
  }
  return obj;
}

export class Logger {
  private correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: redactString(message),
      correlationId: this.correlationId,
      data: data ? redactObject(data) : undefined
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  static fromRequest(req: NextRequest): Logger {
    const correlationId = req.headers.get('x-correlation-id') || req.headers.get('x-request-id') || undefined;
    return new Logger(correlationId);
  }
}