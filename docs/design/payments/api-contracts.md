# Payments API Contracts

## Purpose

Define REST API endpoints, webhook schemas, and data contracts for payment operations with comprehensive request/response examples and idempotency semantics.

## REST API Endpoints

### Customer Management

#### POST /payments/customers

Create a payment customer mapping for a tenant/client.

**Request**:
```typescript
interface CreateCustomerRequest {
  tenant_id: string;        // UUID
  client_id: string;        // UUID
  email: string;            // Customer email
  metadata?: {
    name?: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  provider?: 'stripe' | 'paypal';  // Default: stripe
}
```

**Response** (201 Created):
```typescript
interface CreateCustomerResponse {
  id: string;                    // Internal customer UUID
  tenant_id: string;
  client_id: string;
  provider: 'stripe' | 'paypal';
  provider_customer_id: string;  // cus_xxx for Stripe
  created_at: string;            // ISO 8601
}
```

**Idempotency**: Use header `Idempotency-Key: <uuid>`. Duplicate requests return cached 201 response.

**Errors**:
- `400.schema_invalid`: Request body validation failed
- `401.unauthorized`: Missing or invalid authentication
- `403.forbidden`: Tenant access denied
- `409.duplicate_customer`: Customer already exists for this tenant/client/provider
- `502.provider_error_stripe`: Stripe API failure

**Example**:
```bash
curl -X POST https://api.platform.example.com/payments/customers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "tenant_id": "tenant-uuid",
    "client_id": "client-uuid",
    "email": "client@example.com",
    "metadata": {
      "name": "Acme Corp",
      "phone": "+1-555-0100"
    }
  }'
```

#### GET /payments/customers/:id

Retrieve customer details.

**Response** (200 OK):
```typescript
interface GetCustomerResponse {
  id: string;
  tenant_id: string;
  client_id: string;
  provider: 'stripe' | 'paypal';
  provider_customer_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

**Errors**:
- `404.customer_not_found`: Customer does not exist

### Subscription Management

#### POST /payments/subscriptions

Create a subscription for a customer.

**Request**:
```typescript
interface CreateSubscriptionRequest {
  customer_id: string;           // Internal customer UUID
  plan_id: string;               // Plan UUID
  metadata?: Record<string, any>;
  trial_days?: number;           // Optional trial period
  proration_behavior?: 'create_prorations' | 'none';
}
```

**Response** (201 Created):
```typescript
interface CreateSubscriptionResponse {
  id: string;                           // Internal subscription UUID
  customer_id: string;
  plan_id: string;
  provider_subscription_id: string;     // sub_xxx for Stripe
  status: 'active' | 'incomplete';
  period: {
    start: string;                      // ISO 8601
    end: string;
    billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  };
  created_at: string;
}
```

**Idempotency**: Use header `Idempotency-Key: <uuid>`.

**Errors**:
- `400.schema_invalid`: Invalid request
- `404.customer_not_found`: Customer does not exist
- `404.plan_not_found`: Plan does not exist
- `502.provider_error_stripe`: Stripe API failure

**Example**:
```bash
curl -X POST https://api.platform.example.com/payments/subscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 660e8400-e29b-41d4-a716-446655440001" \
  -d '{
    "customer_id": "customer-uuid",
    "plan_id": "plan-uuid",
    "trial_days": 14
  }'
```

#### PATCH /payments/subscriptions/:id

Update subscription (change plan, pause, resume).

**Request**:
```typescript
interface UpdateSubscriptionRequest {
  plan_id?: string;              // Change to new plan
  status?: 'active' | 'paused' | 'canceled';
  proration_behavior?: 'create_prorations' | 'none';
  cancel_at_period_end?: boolean;
}
```

**Response** (200 OK):
```typescript
interface UpdateSubscriptionResponse {
  id: string;
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  plan_id: string;
  period: {
    start: string;
    end: string;
    billing_cycle: string;
  };
  updated_at: string;
}
```

**Errors**:
- `404.subscription_not_found`: Subscription does not exist
- `409.subscription_state_conflict`: Cannot perform operation in current state

#### GET /payments/subscriptions/:id

Retrieve subscription details.

**Response** (200 OK):
```typescript
interface GetSubscriptionResponse {
  id: string;
  customer_id: string;
  plan_id: string;
  provider_subscription_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'paused' | 'incomplete';
  period: {
    start: string;
    end: string;
    billing_cycle: string;
  };
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
}
```

### Usage Recording

#### POST /payments/usage

Record usage event for metered billing.

**Request**:
```typescript
interface RecordUsageRequest {
  subscription_id: string;      // Subscription UUID
  metric_key: string;           // e.g., "llm_tokens", "voice_minutes"
  quantity: number;             // Usage amount (decimal)
  vendor_cost_cents: number;    // Actual cost from provider
  event_time?: string;          // ISO 8601 (defaults to now)
  correlation_id?: string;      // Trace ID
  metadata?: {
    provider?: string;          // e.g., "openai", "twilio"
    model?: string;             // e.g., "gpt-4-turbo"
    [key: string]: any;
  };
}
```

**Response** (202 Accepted):
```typescript
interface RecordUsageResponse {
  id: string;                   // Usage event UUID
  subscription_id: string;
  metric_key: string;
  quantity: number;
  vendor_cost_cents: number;
  event_time: string;
  correlation_id: string;
  created_at: string;
}
```

**Async Processing**: Usage events are enqueued for processing. Invoice generation happens at billing cycle end.

**Idempotency**: Use header `Idempotency-Key: <uuid>` to prevent duplicate usage recording.

**Errors**:
- `400.schema_invalid`: Invalid request
- `404.subscription_not_found`: Subscription does not exist
- `400.invalid_metric_key`: Unknown metric
- `400.negative_quantity`: Quantity must be positive

**Example**:
```bash
curl -X POST https://api.platform.example.com/payments/usage \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 770e8400-e29b-41d4-a716-446655440002" \
  -d '{
    "subscription_id": "sub-uuid",
    "metric_key": "llm_tokens",
    "quantity": 1550,
    "vendor_cost_cents": 12,
    "metadata": {
      "provider": "openai",
      "model": "gpt-4-turbo",
      "prompt_tokens": 1200,
      "completion_tokens": 350
    }
  }'
```

#### GET /payments/usage

Query usage events (for reporting/debugging).

**Query Parameters**:
- `subscription_id`: Filter by subscription (required)
- `metric_key`: Filter by metric (optional)
- `start_date`: ISO 8601 (optional)
- `end_date`: ISO 8601 (optional)
- `limit`: Max results (default: 100, max: 1000)
- `offset`: Pagination offset

**Response** (200 OK):
```typescript
interface ListUsageResponse {
  data: UsageEvent[];
  total: number;
  limit: number;
  offset: number;
}

interface UsageEvent {
  id: string;
  subscription_id: string;
  metric_key: string;
  quantity: number;
  vendor_cost_cents: number;
  event_time: string;
  correlation_id: string;
  metadata: Record<string, any>;
  created_at: string;
  processed: boolean;
}
```

### Invoice Management

#### POST /payments/invoices/finalize

Finalize invoice for a billing period (generate invoice, calculate charges, trigger payment).

**Request**:
```typescript
interface FinalizeInvoiceRequest {
  subscription_id: string;      // Subscription UUID
  period_start?: string;        // ISO 8601 (defaults to current period)
  period_end?: string;          // ISO 8601 (defaults to current period)
  auto_charge?: boolean;        // Default: true (send invoice to provider)
}
```

**Response** (200 OK):
```typescript
interface FinalizeInvoiceResponse {
  id: string;                   // Invoice UUID
  subscription_id: string;
  total_cents: number;
  currency: string;
  status: 'open' | 'draft';
  provider_invoice_id: string;  // in_xxx for Stripe
  period_start: string;
  period_end: string;
  due_date: string;
  line_items: InvoiceLineItem[];
  finalized_at: string;
}

interface InvoiceLineItem {
  id: string;
  metric_key: string | null;    // null for subscription line
  quantity: number | null;
  unit_price_cents: number;
  total_cents: number;
  type: 'subscription' | 'usage' | 'credit' | 'refund';
  metadata: Record<string, any>;
}
```

**Idempotency**: Use header `Idempotency-Key: <uuid>`. Re-finalizing same period returns existing invoice.

**Errors**:
- `404.subscription_not_found`: Subscription does not exist
- `409.invoice_already_finalized`: Invoice already exists for this period
- `400.no_usage_data`: No usage events found for period
- `502.provider_error_stripe`: Stripe API failure

**Example**:
```bash
curl -X POST https://api.platform.example.com/payments/invoices/finalize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 880e8400-e29b-41d4-a716-446655440003" \
  -d '{
    "subscription_id": "sub-uuid",
    "auto_charge": true
  }'
```

#### GET /payments/invoices/:id

Retrieve invoice details with line items.

**Response** (200 OK):
```typescript
interface GetInvoiceResponse {
  id: string;
  subscription_id: string;
  total_cents: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  provider_invoice_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  finalized_at: string;
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

**Errors**:
- `404.invoice_not_found`: Invoice does not exist

#### GET /payments/invoices

List invoices for a subscription.

**Query Parameters**:
- `subscription_id`: Filter by subscription (required)
- `status`: Filter by status (optional)
- `limit`: Max results (default: 20, max: 100)
- `offset`: Pagination offset

**Response** (200 OK):
```typescript
interface ListInvoicesResponse {
  data: Invoice[];
  total: number;
  limit: number;
  offset: number;
}
```

### Ledger Queries

#### GET /payments/ledger

Query ledger entries for audit and reconciliation.

**Query Parameters**:
- `customer_id`: Filter by customer (required)
- `invoice_id`: Filter by invoice (optional)
- `start_date`: ISO 8601 (optional)
- `end_date`: ISO 8601 (optional)
- `ref_type`: Filter by reference type (optional)
- `limit`: Max results (default: 100, max: 1000)
- `offset`: Pagination offset

**Response** (200 OK):
```typescript
interface ListLedgerResponse {
  data: LedgerEntry[];
  balance_cents: number;        // Current balance (debits - credits)
  total: number;
  limit: number;
  offset: number;
}

interface LedgerEntry {
  id: string;
  customer_id: string;
  invoice_id: string | null;
  debit_cents: number;
  credit_cents: number;
  ref_type: 'invoice' | 'payment' | 'refund' | 'adjustment' | 'chargeback';
  ref_id: string;
  correlation_id: string;
  metadata: Record<string, any>;
  created_at: string;
}
```

**Example**:
```bash
curl -X GET "https://api.platform.example.com/payments/ledger?customer_id=cust-uuid&limit=50" \
  -H "Authorization: Bearer <token>"
```

## Webhook Endpoints

### POST /ingress/payments/stripe

Receive webhooks from Stripe.

**Headers** (required):
- `Stripe-Signature`: HMAC signature for verification

**Request Body**: Raw JSON webhook event from Stripe

**Verification**:
```typescript
import Stripe from 'stripe';

const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Response**: Always return `200 OK` quickly (within 100ms) after signature verification to prevent retries.

**Supported Events**:
- `invoice.payment_succeeded`: Payment received for invoice
- `invoice.payment_failed`: Payment failed
- `customer.subscription.updated`: Subscription status changed
- `customer.subscription.deleted`: Subscription canceled
- `charge.refunded`: Refund issued
- `charge.dispute.created`: Chargeback initiated

**Example Webhook Payload** (invoice.payment_succeeded):
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_1234567890",
      "customer": "cus_ABC123",
      "subscription": "sub_XYZ789",
      "amount_paid": 15000,
      "currency": "usd",
      "status": "paid",
      "paid": true
    }
  },
  "created": 1698765432
}
```

**Internal Processing Flow**:
1. Verify signature (timing-safe comparison)
2. Check event ID for duplicates (Redis cache, 24h TTL)
3. If duplicate, return 200 (already processed)
4. Normalize to canonical `PaymentEvent` schema
5. Enqueue for async processing
6. Return 200 OK

### POST /ingress/payments/paypal

Receive webhooks from PayPal.

**Headers** (required):
- `PayPal-Transmission-Id`: Unique event ID
- `PayPal-Transmission-Time`: Event timestamp
- `PayPal-Transmission-Sig`: Signature
- `PayPal-Cert-Url`: Certificate URL for verification
- `PayPal-Auth-Algo`: Signature algorithm

**Verification**: Certificate-based (download cert, verify signature)

**Supported Events**:
- `PAYMENT.SALE.COMPLETED`: Payment successful
- `PAYMENT.SALE.REFUNDED`: Refund issued
- `BILLING.SUBSCRIPTION.UPDATED`: Subscription changed
- `BILLING.SUBSCRIPTION.CANCELLED`: Subscription canceled

## Canonical Payment Event Schema

All webhook events are normalized to this internal schema for consistent processing:

```typescript
interface PaymentEvent {
  id: string;                       // Unique event ID
  type: PaymentEventType;
  provider: 'stripe' | 'paypal';
  provider_event_id: string;        // Original event ID from provider
  timestamp: string;                // ISO 8601
  correlation_id: string;           // Trace ID
  data: {
    customer?: {
      provider_customer_id: string;
      email?: string;
    };
    subscription?: {
      provider_subscription_id: string;
      status?: SubscriptionStatus;
    };
    invoice?: {
      provider_invoice_id: string;
      amount_cents: number;
      currency: string;
      status: InvoiceStatus;
      paid: boolean;
    };
    payment?: {
      provider_payment_id: string;
      amount_cents: number;
      currency: string;
      method?: string;
    };
    refund?: {
      provider_refund_id: string;
      amount_cents: number;
      reason?: string;
    };
  };
  metadata: Record<string, any>;    // Provider-specific extra data
}

enum PaymentEventType {
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  REFUND_ISSUED = 'refund.issued',
  CHARGEBACK_CREATED = 'chargeback.created',
}

enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
  INCOMPLETE = 'incomplete',
}

enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}
```

## JSON Schema Contracts

### Customer Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "tenant_id": {"type": "string", "format": "uuid"},
    "client_id": {"type": "string", "format": "uuid"},
    "provider": {"type": "string", "enum": ["stripe", "paypal"]},
    "provider_customer_id": {"type": "string"},
    "metadata": {"type": "object"},
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  },
  "required": ["id", "tenant_id", "client_id", "provider", "provider_customer_id", "created_at"]
}
```

### Subscription Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "customer_id": {"type": "string", "format": "uuid"},
    "plan_id": {"type": "string", "format": "uuid"},
    "provider_subscription_id": {"type": "string"},
    "status": {
      "type": "string",
      "enum": ["active", "canceled", "past_due", "paused", "incomplete"]
    },
    "period": {
      "type": "object",
      "properties": {
        "start": {"type": "string", "format": "date-time"},
        "end": {"type": "string", "format": "date-time"},
        "billing_cycle": {"type": "string", "enum": ["monthly", "quarterly", "yearly"]}
      },
      "required": ["start", "end", "billing_cycle"]
    },
    "metadata": {"type": "object"},
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"},
    "canceled_at": {"type": ["string", "null"], "format": "date-time"}
  },
  "required": ["id", "customer_id", "plan_id", "status", "period", "created_at"]
}
```

### Usage Event Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "subscription_id": {"type": "string", "format": "uuid"},
    "client_id": {"type": "string", "format": "uuid"},
    "agent_id": {"type": ["string", "null"], "format": "uuid"},
    "metric_key": {"type": "string"},
    "quantity": {"type": "number", "minimum": 0},
    "vendor_cost_cents": {"type": "integer", "minimum": 0},
    "event_time": {"type": "string", "format": "date-time"},
    "correlation_id": {"type": "string"},
    "metadata": {"type": "object"},
    "created_at": {"type": "string", "format": "date-time"},
    "processed": {"type": "boolean"}
  },
  "required": ["id", "subscription_id", "client_id", "metric_key", "quantity", "vendor_cost_cents", "event_time", "created_at", "processed"]
}
```

### Invoice Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "subscription_id": {"type": "string", "format": "uuid"},
    "total_cents": {"type": "integer", "minimum": 0},
    "currency": {"type": "string", "pattern": "^[a-z]{3}$"},
    "status": {
      "type": "string",
      "enum": ["draft", "open", "paid", "void", "uncollectible"]
    },
    "provider_invoice_id": {"type": ["string", "null"]},
    "period_start": {"type": "string", "format": "date-time"},
    "period_end": {"type": "string", "format": "date-time"},
    "due_date": {"type": ["string", "null"], "format": "date-time"},
    "finalized_at": {"type": ["string", "null"], "format": "date-time"},
    "paid_at": {"type": ["string", "null"], "format": "date-time"},
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "invoice_id": {"type": "string", "format": "uuid"},
          "metric_key": {"type": ["string", "null"]},
          "quantity": {"type": ["number", "null"]},
          "unit_price_cents": {"type": "integer"},
          "total_cents": {"type": "integer"},
          "type": {
            "type": "string",
            "enum": ["subscription", "usage", "credit", "refund", "adjustment"]
          },
          "metadata": {"type": "object"}
        },
        "required": ["id", "invoice_id", "unit_price_cents", "total_cents", "type"]
      }
    },
    "metadata": {"type": "object"},
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  },
  "required": ["id", "subscription_id", "total_cents", "currency", "status", "period_start", "period_end", "created_at"]
}
```

## Idempotency Semantics

### Client-Provided Idempotency Keys

All mutating endpoints (`POST`, `PATCH`, `DELETE`) support idempotency via header:

```
Idempotency-Key: <uuid>
```

**Behavior**:
1. First request with key: Process normally, cache response (Redis, 24h TTL)
2. Duplicate request with same key: Return cached response immediately (same status code)
3. Expired key: Process as new request

**Cache Key Format**:
```
idempotency:{endpoint}:{idempotency-key}
```

**Example**:
```typescript
@Post('/customers')
@UseInterceptors(IdempotencyInterceptor)
async createCustomer(
  @Body() dto: CreateCustomerDto,
  @Headers('idempotency-key') idempotencyKey: string,
) {
  // IdempotencyInterceptor handles cache check/store
  return this.customerService.create(dto);
}
```

### Webhook Event Deduplication

Webhook events are deduplicated by provider event ID:

**Cache Key Format**:
```
webhook:{provider}:{provider_event_id}
```

**TTL**: 24 hours

**Behavior**:
1. Webhook received: Check cache for `webhook:stripe:evt_123`
2. If exists: Return 200 OK (already processed)
3. If not exists: Process event, store cache entry, return 200 OK

## Error Response Format

All API errors follow consistent structure:

```typescript
interface ErrorResponse {
  error: {
    code: string;               // Machine-readable error code
    message: string;            // Human-readable message
    details?: Record<string, any>;  // Additional context
    correlation_id: string;     // Trace ID
  };
}
```

**Example** (400 Schema Invalid):
```json
{
  "error": {
    "code": "400.schema_invalid",
    "message": "Request validation failed",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "correlation_id": "req_abc123xyz"
  }
}
```

**Example** (409 Duplicate Customer):
```json
{
  "error": {
    "code": "409.duplicate_customer",
    "message": "Customer already exists for this tenant/client/provider combination",
    "details": {
      "existing_customer_id": "customer-uuid-123"
    },
    "correlation_id": "req_def456uvw"
  }
}
```

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| **Customer/Subscription APIs** | 100 requests/minute | Per tenant |
| **Usage Recording** | 1000 requests/minute | Per tenant |
| **Invoice/Ledger Queries** | 50 requests/minute | Per tenant |
| **Webhook Ingress** | 500 events/minute | Per provider |

### Headers

Rate limit info included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1698765500
```

### Exceeded Response

**Status**: 429 Too Many Requests

```json
{
  "error": {
    "code": "429.rate_limit_exceeded",
    "message": "Rate limit exceeded. Retry after 30 seconds.",
    "details": {
      "limit": 100,
      "window_seconds": 60,
      "retry_after_seconds": 30
    },
    "correlation_id": "req_ghi789rst"
  }
}
```

## Authentication & Authorization

### Authentication

All API requests require JWT bearer token:

```
Authorization: Bearer <jwt_token>
```

Token must include claims:
- `tenant_id`: Tenant UUID
- `user_id`: User UUID
- `roles`: Array of role names

### Authorization (RBAC)

| Endpoint | Required Permission |
|----------|-------------------|
| **POST /payments/customers** | `payments:customers:create` |
| **GET /payments/customers/:id** | `payments:customers:read` |
| **POST /payments/subscriptions** | `payments:subscriptions:create` |
| **PATCH /payments/subscriptions/:id** | `payments:subscriptions:update` |
| **GET /payments/subscriptions/:id** | `payments:subscriptions:read` |
| **POST /payments/usage** | `payments:usage:create` |
| **GET /payments/usage** | `payments:usage:read` |
| **POST /payments/invoices/finalize** | `payments:invoices:finalize` |
| **GET /payments/invoices/:id** | `payments:invoices:read` |
| **GET /payments/ledger** | `payments:ledger:read` |

### Tenant Isolation

All queries are scoped to authenticated tenant:

```sql
-- Automatic tenant filter applied by middleware
SELECT * FROM payment_customers 
WHERE tenant_id = :authenticated_tenant_id 
  AND id = :customer_id;
```

**Forbidden Response** (403):
```json
{
  "error": {
    "code": "403.forbidden",
    "message": "Access denied to resource in different tenant",
    "correlation_id": "req_jkl012mno"
  }
}
```

## Next Steps

Proceed to:
- **[Stripe Adapter](./stripe-adapter.md)** - Stripe-specific implementation
- **[Billing Engine](./billing-engine.md)** - Invoice generation and valuation
- **[Reconciliation](./reconciliation.md)** - Payment matching and disputes
