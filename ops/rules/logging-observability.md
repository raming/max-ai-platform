# Logging and observability (canonical)

Purpose
Define consistent logging, metrics, and tracing practices so coders and SREs can reliably operate the system without noise or blind spots.

Structured logging
- JSON logs only; no free‑form strings. Always include: timestamp, level, service, environment, correlation_id (request_id), user/seat if available.
- Never log secrets, tokens, PHI/PII. Mask/redact known fields at the edge (middleware/interceptors).
- Log keys, not essays: prefer {"event":"order.created","order_id":"…","store":"…"} over long messages.

Levels and guidance
- TRACE: extremely verbose internal steps; off in prod.
- DEBUG: developer diagnostics; **MANDATORY in development** for troubleshooting and understanding code flow. Include key decision points, input validation, state changes, and error context. Examples: "DEBUG: User authentication successful for user_id=123", "DEBUG: Processing order with items=[1,2,3]", "DEBUG: Cache miss for key=user:123, fetching from DB".
- INFO: business‑relevant events (state transitions: created/submitted/ready), lifecycle milestones (start/stop), configuration load.
- WARN: unusual but recoverable conditions (retry scheduled, fallback path). Actionable but not necessarily errors.
- ERROR: actual failures that need attention (request failed, data corruption detected). Should be tied to alerts/SLOs.
- FATAL: process‑ending conditions. Rare.

**DEBUG LOGGING REQUIREMENTS (MANDATORY FOR DEVELOPMENT):**
- **Every function/method entry**: Log key parameters (excluding sensitive data) at DEBUG level
- **Decision points**: Log which branch/path is taken with relevant context
- **State changes**: Log before/after state transitions with meaningful context
- **External calls**: Log request/response summaries (not full payloads) at DEBUG
- **Error context**: Include DEBUG logs leading up to any ERROR log
- **Performance markers**: DEBUG logs for operation start/end with timing context

Example debug logging patterns:
```typescript
// Function entry with key parameters
async function processOrder(orderId: string, userId: string) {
  logger.debug('processOrder: starting', { orderId, userId });
  
  // Decision point logging
  if (await this.validateOrder(orderId)) {
    logger.debug('processOrder: validation passed, proceeding with payment', { orderId });
    // ... payment logic
  } else {
    logger.debug('processOrder: validation failed', { orderId, reason: 'invalid items' });
    throw new ValidationError('Order validation failed');
  }
}

// State change logging
logger.debug('User status changed', { 
  userId, 
  fromStatus: 'pending', 
  toStatus: 'active', 
  trigger: 'email_verification' 
});

// External call logging
logger.debug('API call completed', {
  endpoint: '/api/payment',
  method: 'POST',
  statusCode: 200,
  durationMs: 150,
  correlationId
});
```

Rules of thumb
- Do not log ERROR for expected domain outcomes (e.g., invalid input validation); use INFO or WARN with context and return 4xx.
- One ERROR per failure path: avoid cascades that flood logs. Include cause chain.
- Use WARN for degraded operations (e.g., provider timeout with retry), include retry count/backoff.

Correlation and context
- Propagate correlation_id/request_id across services; inject into every log line for a request.
- Include domain IDs sparingly: order_id, patient_id, store_id (no PHI).

Metrics & alerts
- Emit counters for success/failure by route; histograms for latency (p50/p95/p99); gauges for in‑flight requests.
- Tie ERROR rates and p95 latency to SLO alerts with sensible burn‑rate policies.

Tracing
- OpenTelemetry spans around inbound requests, external calls (DB, HTTP, queue), and critical domain operations.
- Attach attributes (route, status_code, retry_count) and link correlation_id to trace_id.

**LOGGING MIDDLEWARE REQUIREMENTS (MANDATORY):**

Backend Logging Middleware (NestJS/Node.js):
```typescript
// Request logging interceptor - MANDATORY for all HTTP endpoints
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const correlationId = request.headers['x-correlation-id'] || generateId();
    
    // Set correlation ID in response header
    response.setHeader('x-correlation-id', correlationId);
    
    // DEBUG: Request entry
    this.logger.debug('HTTP Request started', {
      method: request.method,
      url: request.url,
      correlationId,
      userAgent: request.headers['user-agent']?.substring(0, 100),
      ip: request.ip
    });
    
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        // INFO: Successful response
        this.logger.info('HTTP Request completed', {
          method: request.method,
          url: request.url,
          statusCode: response.statusCode,
          duration,
          correlationId
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        // ERROR: Failed request
        this.logger.error('HTTP Request failed', {
          method: request.method,
          url: request.url,
          statusCode: error.status || 500,
          duration,
          correlationId,
          error: error.message,
          stack: error.stack?.substring(0, 500) // Truncate for readability
        });
        throw error;
      })
    );
  }
}

// Global exception filter - MANDATORY
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const correlationId = request.headers['x-correlation-id'] || 'unknown';
    
    // ERROR: Unhandled exception
    this.logger.error('Unhandled exception', {
      correlationId,
      url: request.url,
      method: request.method,
      error: exception.message,
      stack: exception.stack?.substring(0, 1000),
      userId: request.user?.id
    });
    
    // Return sanitized error response
    response.status(500).json({
      error: 'Internal server error',
      correlationId
    });
  }
}
```

Frontend Logging Middleware (React/Vue/Angular):
```typescript
// API client logging interceptor - MANDATORY for all HTTP calls
class LoggingInterceptor {
  intercept(request: Request, next: Handler): Observable<Response> {
    const correlationId = request.headers.get('x-correlation-id') || generateId();
    const startTime = Date.now();
    
    // Add correlation ID to request
    request.headers.set('x-correlation-id', correlationId);
    
    // DEBUG: API request started
    logger.debug('API Request started', {
      method: request.method,
      url: request.url,
      correlationId
    });
    
    return next(request).pipe(
      tap(response => {
        const duration = Date.now() - startTime;
        // INFO: API request completed
        logger.info('API Request completed', {
          method: request.method,
          url: request.url,
          status: response.status,
          duration,
          correlationId
        });
      }),
      catchError(error => {
        const duration = Date.now() - startTime;
        // ERROR: API request failed
        logger.error('API Request failed', {
          method: request.method,
          url: request.url,
          status: error.status || 'network_error',
          duration,
          correlationId,
          error: error.message
        });
        throw error;
      })
    );
  }
}

// Global error boundary logging - MANDATORY
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    const correlationId = generateId();
    
    // ERROR: React error boundary caught error
    logger.error('React Error Boundary', {
      correlationId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack?.substring(0, 500),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }
}
```

**MIDDLEWARE IMPLEMENTATION REQUIREMENTS:**
- **Backend**: Request logging interceptor + global exception filter on ALL routes
- **Frontend**: API client interceptor + error boundary on root component
- **Correlation IDs**: Generated for each request, propagated across services
- **Sensitive data masking**: Automatic redaction of passwords, tokens, PII
- **Performance logging**: Request duration tracking and alerting thresholds

Testing logging
- Unit: assert key events are logged at the right level (use in‑memory transports).
- Integration: verify request logging and error logging on failure paths.

Review checklist (maintainers)
- Are levels appropriate (no error‑spam; actionable WARN/ERROR)?
- Are correlation IDs and key context present? PII redaction in place?
- Are logs structured and sparse (no walls of text)?
- Are metrics/traces emitted for critical paths?
