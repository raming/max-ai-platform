# Stripe Adapter Implementation

## Purpose

Implement the `IPaymentProviderPort` interface for Stripe, handling customer management, subscriptions, invoicing, and webhook processing with idempotent operations and comprehensive error handling.

## Stripe SDK Integration

### Dependencies

```json
{
  "dependencies": {
    "stripe": "^14.8.0"
  },
  "devDependencies": {
    "@types/stripe": "^8.0.417"
  }
}
```

### Configuration

```typescript
import Stripe from 'stripe';

@Injectable()
export class StripeAdapter implements IPaymentProviderPort {
  private readonly stripe: Stripe;

  constructor(
    @Inject('STRIPE_CONFIG') private config: StripeConfig,
  ) {
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: '2023-10-16',
      typescript: true,
      timeout: 30000,  // 30s timeout
      maxNetworkRetries: 3,  // Exponential backoff retries
    });
  }
}

interface StripeConfig {
  apiKey: string;              // sk_live_xxx or sk_test_xxx
  webhookSecret: string;       // whsec_xxx
  apiVersion: string;          // Stripe API version
}
```

### Environment Variables

```bash
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_API_VERSION=2023-10-16
```

## IPaymentProviderPort Implementation

### Interface Definition

```typescript
export interface IPaymentProviderPort {
  // Customer management
  createCustomer(dto: CreateCustomerDto): Promise<CustomerResult>;
  getCustomer(providerCustomerId: string): Promise<CustomerResult>;
  updateCustomer(providerCustomerId: string, dto: UpdateCustomerDto): Promise<CustomerResult>;
  
  // Subscription management
  createSubscription(dto: CreateSubscriptionDto): Promise<SubscriptionResult>;
  updateSubscription(providerSubscriptionId: string, dto: UpdateSubscriptionDto): Promise<SubscriptionResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<SubscriptionResult>;
  
  // Invoice operations
  createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResult>;
  finalizeInvoice(providerInvoiceId: string): Promise<InvoiceResult>;
  voidInvoice(providerInvoiceId: string): Promise<InvoiceResult>;
  
  // Usage reporting
  recordUsage(dto: RecordUsageDto): Promise<UsageResult>;
  
  // Webhook verification
  verifyWebhook(payload: string, signature: string): WebhookEvent;
}
```

### Customer Operations

#### createCustomer

```typescript
async createCustomer(dto: CreateCustomerDto): Promise<CustomerResult> {
  try {
    const customer = await this.stripe.customers.create({
      email: dto.email,
      name: dto.metadata?.name,
      phone: dto.metadata?.phone,
      address: dto.metadata?.address,
      metadata: {
        tenant_id: dto.tenant_id,
        client_id: dto.client_id,
        ...dto.metadata,
      },
    }, {
      idempotencyKey: dto.idempotencyKey,  // Stripe handles dedup
    });

    return {
      provider_customer_id: customer.id,
      email: customer.email,
      metadata: customer.metadata,
      created_at: new Date(customer.created * 1000).toISOString(),
    };
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

#### getCustomer

```typescript
async getCustomer(providerCustomerId: string): Promise<CustomerResult> {
  try {
    const customer = await this.stripe.customers.retrieve(providerCustomerId);
    
    if (customer.deleted) {
      throw new NotFoundException(`Customer ${providerCustomerId} has been deleted`);
    }

    return {
      provider_customer_id: customer.id,
      email: customer.email,
      metadata: customer.metadata,
      created_at: new Date(customer.created * 1000).toISOString(),
    };
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

#### updateCustomer

```typescript
async updateCustomer(
  providerCustomerId: string,
  dto: UpdateCustomerDto,
): Promise<CustomerResult> {
  try {
    const customer = await this.stripe.customers.update(
      providerCustomerId,
      {
        email: dto.email,
        name: dto.metadata?.name,
        phone: dto.metadata?.phone,
        address: dto.metadata?.address,
        metadata: dto.metadata,
      },
    );

    return {
      provider_customer_id: customer.id,
      email: customer.email,
      metadata: customer.metadata,
      created_at: new Date(customer.created * 1000).toISOString(),
    };
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

### Subscription Operations

#### createSubscription

```typescript
async createSubscription(dto: CreateSubscriptionDto): Promise<SubscriptionResult> {
  try {
    const subscription = await this.stripe.subscriptions.create({
      customer: dto.provider_customer_id,
      items: [
        {
          price: dto.provider_price_id,  // Stripe Price ID (price_xxx)
        },
      ],
      trial_period_days: dto.trial_days,
      proration_behavior: dto.proration_behavior || 'create_prorations',
      collection_method: 'charge_automatically',
      metadata: {
        plan_id: dto.plan_id,
        ...dto.metadata,
      },
    }, {
      idempotencyKey: dto.idempotencyKey,
    });

    return this.mapSubscriptionResult(subscription);
  } catch (error) {
    throw this.handleStripeError(error);
  }
}

private mapSubscriptionResult(subscription: Stripe.Subscription): SubscriptionResult {
  return {
    provider_subscription_id: subscription.id,
    status: this.mapSubscriptionStatus(subscription.status),
    period: {
      start: new Date(subscription.current_period_start * 1000).toISOString(),
      end: new Date(subscription.current_period_end * 1000).toISOString(),
    },
    trial_end: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null,
    metadata: subscription.metadata,
    created_at: new Date(subscription.created * 1000).toISOString(),
  };
}

private mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    canceled: SubscriptionStatus.CANCELED,
    past_due: SubscriptionStatus.PAST_DUE,
    paused: SubscriptionStatus.PAUSED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.CANCELED,
    trialing: SubscriptionStatus.ACTIVE,
    unpaid: SubscriptionStatus.PAST_DUE,
  };
  
  return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
}
```

#### updateSubscription

```typescript
async updateSubscription(
  providerSubscriptionId: string,
  dto: UpdateSubscriptionDto,
): Promise<SubscriptionResult> {
  try {
    const updates: Stripe.SubscriptionUpdateParams = {};
    
    if (dto.provider_price_id) {
      // Change plan
      updates.items = [
        {
          id: (await this.stripe.subscriptions.retrieve(providerSubscriptionId)).items.data[0].id,
          price: dto.provider_price_id,
        },
      ];
      updates.proration_behavior = dto.proration_behavior || 'create_prorations';
    }
    
    if (dto.cancel_at_period_end !== undefined) {
      updates.cancel_at_period_end = dto.cancel_at_period_end;
    }
    
    if (dto.pause) {
      updates.pause_collection = {
        behavior: 'void',
      };
    } else if (dto.resume) {
      updates.pause_collection = null;
    }

    const subscription = await this.stripe.subscriptions.update(
      providerSubscriptionId,
      updates,
    );

    return this.mapSubscriptionResult(subscription);
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

#### cancelSubscription

```typescript
async cancelSubscription(providerSubscriptionId: string): Promise<SubscriptionResult> {
  try {
    const subscription = await this.stripe.subscriptions.cancel(providerSubscriptionId);
    
    return this.mapSubscriptionResult(subscription);
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

### Invoice Operations

#### createInvoice

```typescript
async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResult> {
  try {
    const invoice = await this.stripe.invoices.create({
      customer: dto.provider_customer_id,
      subscription: dto.provider_subscription_id,
      auto_advance: dto.auto_finalize ?? true,  // Auto-finalize and send
      collection_method: 'charge_automatically',
      metadata: dto.metadata,
    }, {
      idempotencyKey: dto.idempotencyKey,
    });

    return this.mapInvoiceResult(invoice);
  } catch (error) {
    throw this.handleStripeError(error);
  }
}

private mapInvoiceResult(invoice: Stripe.Invoice): InvoiceResult {
  return {
    provider_invoice_id: invoice.id,
    total_cents: invoice.total,
    currency: invoice.currency,
    status: this.mapInvoiceStatus(invoice.status),
    period_start: new Date(invoice.period_start * 1000).toISOString(),
    period_end: new Date(invoice.period_end * 1000).toISOString(),
    due_date: invoice.due_date 
      ? new Date(invoice.due_date * 1000).toISOString() 
      : null,
    finalized_at: invoice.status_transitions.finalized_at
      ? new Date(invoice.status_transitions.finalized_at * 1000).toISOString()
      : null,
    paid_at: invoice.status_transitions.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : null,
    hosted_invoice_url: invoice.hosted_invoice_url,
    invoice_pdf: invoice.invoice_pdf,
    metadata: invoice.metadata,
  };
}

private mapInvoiceStatus(stripeStatus: Stripe.Invoice.Status): InvoiceStatus {
  const statusMap: Record<Stripe.Invoice.Status, InvoiceStatus> = {
    draft: InvoiceStatus.DRAFT,
    open: InvoiceStatus.OPEN,
    paid: InvoiceStatus.PAID,
    void: InvoiceStatus.VOID,
    uncollectible: InvoiceStatus.UNCOLLECTIBLE,
  };
  
  return statusMap[stripeStatus] || InvoiceStatus.DRAFT;
}
```

#### finalizeInvoice

```typescript
async finalizeInvoice(providerInvoiceId: string): Promise<InvoiceResult> {
  try {
    const invoice = await this.stripe.invoices.finalizeInvoice(providerInvoiceId, {
      auto_advance: true,  // Attempt payment collection
    });

    return this.mapInvoiceResult(invoice);
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

#### voidInvoice

```typescript
async voidInvoice(providerInvoiceId: string): Promise<InvoiceResult> {
  try {
    const invoice = await this.stripe.invoices.voidInvoice(providerInvoiceId);
    
    return this.mapInvoiceResult(invoice);
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

### Usage Recording

#### recordUsage

```typescript
async recordUsage(dto: RecordUsageDto): Promise<UsageResult> {
  try {
    // Stripe usage records are tied to subscription items (metered billing)
    const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
      dto.provider_subscription_item_id,  // si_xxx (from subscription.items[0].id)
      {
        quantity: Math.ceil(dto.quantity),  // Stripe requires integer quantity
        timestamp: Math.floor(new Date(dto.event_time).getTime() / 1000),
        action: 'increment',  // or 'set' for absolute values
      },
      {
        idempotencyKey: dto.idempotencyKey,
      },
    );

    return {
      provider_usage_record_id: usageRecord.id,
      quantity: usageRecord.quantity,
      timestamp: new Date(usageRecord.timestamp * 1000).toISOString(),
    };
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

**Note**: Stripe usage recording requires creating a metered Price and tracking the subscription item ID. For cost-plus billing where we calculate charges internally, we use dynamic invoice items instead:

```typescript
async addInvoiceItem(dto: AddInvoiceItemDto): Promise<void> {
  try {
    await this.stripe.invoiceItems.create({
      customer: dto.provider_customer_id,
      currency: dto.currency,
      amount: dto.amount_cents,
      description: dto.description,
      metadata: dto.metadata,
    }, {
      idempotencyKey: dto.idempotencyKey,
    });
  } catch (error) {
    throw this.handleStripeError(error);
  }
}
```

## Webhook Processing

### Webhook Verification

```typescript
verifyWebhook(payload: string, signature: string): Stripe.Event {
  try {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.webhookSecret,
    );
    
    return event;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    throw error;
  }
}
```

### Webhook Event Handler

```typescript
@Controller('ingress/payments')
export class StripeWebhookController {
  constructor(
    private readonly stripeAdapter: StripeAdapter,
    private readonly webhookProcessor: WebhookProcessorService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post('stripe')
  @Header('Content-Type', 'application/json')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    const payload = req.rawBody;  // Must be raw body, not parsed JSON
    
    // 1. Verify signature
    let event: Stripe.Event;
    try {
      event = this.stripeAdapter.verifyWebhook(payload, signature);
    } catch (error) {
      throw new UnauthorizedException('Webhook signature verification failed');
    }
    
    // 2. Check for duplicate event
    const isDuplicate = await this.idempotency.check(`webhook:stripe:${event.id}`);
    if (isDuplicate) {
      this.logger.debug(`Duplicate webhook event: ${event.id}`);
      return { received: true };  // Already processed
    }
    
    // 3. Store idempotency marker
    await this.idempotency.set(`webhook:stripe:${event.id}`, true, 86400);  // 24h TTL
    
    // 4. Normalize to canonical PaymentEvent
    const paymentEvent = this.normalizeStripeEvent(event);
    
    // 5. Enqueue for async processing
    await this.webhookProcessor.enqueue(paymentEvent);
    
    // 6. Return 200 OK quickly (< 100ms)
    return { received: true };
  }
  
  private normalizeStripeEvent(event: Stripe.Event): PaymentEvent {
    const baseEvent: Partial<PaymentEvent> = {
      id: `pe_${uuidv4()}`,
      provider: 'stripe',
      provider_event_id: event.id,
      timestamp: new Date(event.created * 1000).toISOString(),
      correlation_id: event.request?.id || event.id,
    };
    
    switch (event.type) {
      case 'invoice.payment_succeeded':
        return {
          ...baseEvent,
          type: PaymentEventType.INVOICE_PAYMENT_SUCCEEDED,
          data: {
            invoice: {
              provider_invoice_id: (event.data.object as Stripe.Invoice).id,
              amount_cents: (event.data.object as Stripe.Invoice).amount_paid,
              currency: (event.data.object as Stripe.Invoice).currency,
              status: InvoiceStatus.PAID,
              paid: true,
            },
            payment: {
              provider_payment_id: (event.data.object as Stripe.Invoice).charge as string,
              amount_cents: (event.data.object as Stripe.Invoice).amount_paid,
              currency: (event.data.object as Stripe.Invoice).currency,
            },
          },
          metadata: event.data.object,
        };
      
      case 'invoice.payment_failed':
        return {
          ...baseEvent,
          type: PaymentEventType.INVOICE_PAYMENT_FAILED,
          data: {
            invoice: {
              provider_invoice_id: (event.data.object as Stripe.Invoice).id,
              amount_cents: (event.data.object as Stripe.Invoice).amount_due,
              currency: (event.data.object as Stripe.Invoice).currency,
              status: InvoiceStatus.OPEN,
              paid: false,
            },
          },
          metadata: event.data.object,
        };
      
      case 'customer.subscription.updated':
        return {
          ...baseEvent,
          type: PaymentEventType.SUBSCRIPTION_UPDATED,
          data: {
            subscription: {
              provider_subscription_id: (event.data.object as Stripe.Subscription).id,
              status: this.mapSubscriptionStatus((event.data.object as Stripe.Subscription).status),
            },
          },
          metadata: event.data.object,
        };
      
      case 'customer.subscription.deleted':
        return {
          ...baseEvent,
          type: PaymentEventType.SUBSCRIPTION_CANCELED,
          data: {
            subscription: {
              provider_subscription_id: (event.data.object as Stripe.Subscription).id,
              status: SubscriptionStatus.CANCELED,
            },
          },
          metadata: event.data.object,
        };
      
      case 'charge.refunded':
        return {
          ...baseEvent,
          type: PaymentEventType.REFUND_ISSUED,
          data: {
            refund: {
              provider_refund_id: (event.data.object as Stripe.Charge).refunds.data[0]?.id,
              amount_cents: (event.data.object as Stripe.Charge).amount_refunded,
              reason: (event.data.object as Stripe.Charge).refunds.data[0]?.reason,
            },
            payment: {
              provider_payment_id: (event.data.object as Stripe.Charge).id,
              amount_cents: (event.data.object as Stripe.Charge).amount,
              currency: (event.data.object as Stripe.Charge).currency,
            },
          },
          metadata: event.data.object,
        };
      
      case 'charge.dispute.created':
        return {
          ...baseEvent,
          type: PaymentEventType.CHARGEBACK_CREATED,
          data: {
            payment: {
              provider_payment_id: (event.data.object as Stripe.Dispute).charge as string,
              amount_cents: (event.data.object as Stripe.Dispute).amount,
              currency: (event.data.object as Stripe.Dispute).currency,
            },
          },
          metadata: event.data.object,
        };
      
      default:
        // Unknown event type - log and ignore
        this.logger.warn(`Unknown Stripe event type: ${event.type}`);
        return null;
    }
  }
}
```

### Supported Webhook Events

| Stripe Event | Canonical Type | Action |
|-------------|---------------|--------|
| `invoice.payment_succeeded` | INVOICE_PAYMENT_SUCCEEDED | Update invoice status to paid, record ledger credit |
| `invoice.payment_failed` | INVOICE_PAYMENT_FAILED | Alert customer, retry payment, update invoice status |
| `customer.subscription.updated` | SUBSCRIPTION_UPDATED | Sync subscription status changes |
| `customer.subscription.deleted` | SUBSCRIPTION_CANCELED | Mark subscription as canceled |
| `charge.refunded` | REFUND_ISSUED | Record ledger credit, update invoice |
| `charge.dispute.created` | CHARGEBACK_CREATED | Alert ops, record ledger debit, freeze payouts |

## Error Handling

### Stripe Error Types

```typescript
private handleStripeError(error: any): Error {
  if (error instanceof Stripe.errors.StripeCardError) {
    // Card was declined
    return new BadRequestException({
      code: '400.card_declined',
      message: error.message,
      details: {
        decline_code: error.decline_code,
        param: error.param,
      },
    });
  }
  
  if (error instanceof Stripe.errors.StripeRateLimitError) {
    // Rate limit hit
    return new TooManyRequestsException({
      code: '429.stripe_rate_limit',
      message: 'Stripe API rate limit exceeded. Retry after delay.',
    });
  }
  
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    // Invalid parameters
    return new BadRequestException({
      code: '400.invalid_request',
      message: error.message,
      details: {
        param: error.param,
        type: error.type,
      },
    });
  }
  
  if (error instanceof Stripe.errors.StripeAPIError) {
    // Stripe API error (server-side)
    return new BadGatewayException({
      code: '502.provider_error_stripe',
      message: 'Stripe API error. Please retry.',
      details: {
        type: error.type,
        code: error.code,
      },
    });
  }
  
  if (error instanceof Stripe.errors.StripeConnectionError) {
    // Network error
    return new BadGatewayException({
      code: '502.stripe_connection_error',
      message: 'Failed to connect to Stripe. Please retry.',
    });
  }
  
  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    // Invalid API key
    return new UnauthorizedException({
      code: '401.stripe_auth_failed',
      message: 'Stripe authentication failed. Check API key.',
    });
  }
  
  // Unknown error
  this.logger.error('Unknown Stripe error', error);
  return new InternalServerErrorException({
    code: '500.unknown_stripe_error',
    message: 'An unexpected error occurred with Stripe.',
  });
}
```

### Retry Strategy

```typescript
// Stripe SDK automatically retries with exponential backoff
const stripe = new Stripe(apiKey, {
  maxNetworkRetries: 3,  // Retry up to 3 times
  timeout: 30000,        // 30s timeout
});

// Custom retry for specific operations
async function createCustomerWithRetry(dto: CreateCustomerDto): Promise<CustomerResult> {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.stripeAdapter.createCustomer(dto);
    } catch (error) {
      lastError = error;
      
      // Only retry on transient errors
      if (
        error instanceof BadGatewayException ||
        error instanceof TooManyRequestsException
      ) {
        const delay = Math.pow(2, attempt) * 1000;  // 2s, 4s, 8s
        this.logger.warn(`Stripe API error, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
      } else {
        // Non-retriable error, fail immediately
        throw error;
      }
    }
  }
  
  throw lastError;
}
```

### Circuit Breaker

```typescript
@Injectable()
export class StripeCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000;  // 30s
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.RECOVERY_TIMEOUT) {
        this.state = 'half-open';
        this.logger.info('Circuit breaker entering half-open state');
      } else {
        throw new ServiceUnavailableException({
          code: '503.circuit_breaker_open',
          message: 'Stripe API circuit breaker is open. Service temporarily unavailable.',
        });
      }
    }
    
    try {
      const result = await operation();
      
      // Success - reset failure count
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
        this.logger.info('Circuit breaker closed after successful recovery');
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.state = 'open';
        this.logger.error(`Circuit breaker opened after ${this.failureCount} consecutive failures`);
      }
      
      throw error;
    }
  }
}

// Usage
@Injectable()
export class StripeAdapter implements IPaymentProviderPort {
  constructor(
    private readonly circuitBreaker: StripeCircuitBreaker,
  ) {}
  
  async createCustomer(dto: CreateCustomerDto): Promise<CustomerResult> {
    return this.circuitBreaker.execute(() => this._createCustomer(dto));
  }
  
  private async _createCustomer(dto: CreateCustomerDto): Promise<CustomerResult> {
    // Actual Stripe API call
  }
}
```

## Testing

### Unit Tests

```typescript
describe('StripeAdapter', () => {
  let adapter: StripeAdapter;
  let stripeMock: jest.Mocked<Stripe>;
  
  beforeEach(() => {
    stripeMock = {
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    } as any;
    
    adapter = new StripeAdapter({
      apiKey: 'sk_test_xxx',
      webhookSecret: 'whsec_xxx',
      apiVersion: '2023-10-16',
    });
    
    // Inject mock
    (adapter as any).stripe = stripeMock;
  });
  
  describe('createCustomer', () => {
    it('should create customer with correct parameters', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        metadata: {},
        created: 1698765432,
      };
      
      stripeMock.customers.create.mockResolvedValue(mockCustomer as any);
      
      const result = await adapter.createCustomer({
        tenant_id: 'tenant-uuid',
        client_id: 'client-uuid',
        email: 'test@example.com',
        idempotencyKey: 'idem-key-123',
      });
      
      expect(stripeMock.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          metadata: expect.objectContaining({
            tenant_id: 'tenant-uuid',
            client_id: 'client-uuid',
          }),
        }),
        { idempotencyKey: 'idem-key-123' },
      );
      
      expect(result.provider_customer_id).toBe('cus_test123');
    });
  });
  
  describe('verifyWebhook', () => {
    it('should verify valid webhook signature', () => {
      const mockEvent = { id: 'evt_123', type: 'invoice.payment_succeeded' };
      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      
      const result = adapter.verifyWebhook('payload', 'signature');
      
      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        'payload',
        'signature',
        'whsec_xxx',
      );
      expect(result.id).toBe('evt_123');
    });
    
    it('should throw on invalid signature', () => {
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Stripe.errors.StripeSignatureVerificationError('Invalid signature');
      });
      
      expect(() => adapter.verifyWebhook('payload', 'bad-signature')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
```

### Integration Tests (Stripe Test Mode)

```typescript
describe('StripeAdapter Integration', () => {
  let adapter: StripeAdapter;
  
  beforeAll(() => {
    adapter = new StripeAdapter({
      apiKey: process.env.STRIPE_TEST_API_KEY,  // sk_test_xxx
      webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET,
      apiVersion: '2023-10-16',
    });
  });
  
  it('should create and retrieve customer in Stripe test mode', async () => {
    const createResult = await adapter.createCustomer({
      tenant_id: 'test-tenant',
      client_id: 'test-client',
      email: 'integration-test@example.com',
      idempotencyKey: `test-${Date.now()}`,
    });
    
    expect(createResult.provider_customer_id).toMatch(/^cus_/);
    
    const getResult = await adapter.getCustomer(createResult.provider_customer_id);
    expect(getResult.email).toBe('integration-test@example.com');
  });
});
```

## Next Steps

Proceed to:
- **[Billing Engine](./billing-engine.md)** - Invoice generation and usage valuation
- **[Reconciliation](./reconciliation.md)** - Payment matching and dispute handling
