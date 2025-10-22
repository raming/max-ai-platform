# Payments Component Overview

## Purpose

Provide gateway-agnostic payment processing with support for multiple payment providers (Stripe MVP, PayPal Phase 2+), including subscription management, usage-based billing, invoice generation, and payment reconciliation.

## Design Philosophy

### Gateway-Agnostic Architecture

The payments system abstracts payment provider implementations behind ports (interfaces), enabling:

- **Provider Swapping**: Change payment gateways without business logic changes
- **Multi-Provider**: Support multiple providers simultaneously per tenant preference
- **Testability**: Mock providers for testing without external dependencies
- **Cost Transparency**: Track vendor costs separately from client billing

### Idempotent Event Processing

All external events (webhooks, API calls) are processed idempotently:

- **Deduplication**: Event IDs tracked in cache (24h Redis TTL)
- **Retry Safety**: Re-processing same event produces identical outcomes
- **Ledger Immutability**: Append-only ledger ensures audit trail integrity
- **Correlation IDs**: Track event flow across system boundaries

### PCI Compliance (SAQ-A Posture)

Minimize PCI scope by never handling card data:

- **Hosted Payment Pages**: Use Stripe Checkout, PayPal hosted UI
- **No Card Storage**: Payment methods stored with provider only
- **Token References**: Store provider customer/payment method IDs
- **Secure Webhooks**: Verify signatures, validate timestamps, replay protection

### Cost Attribution and Markup

Track vendor costs and apply transparent markup:

- **Vendor Cost Tracking**: Record actual costs from usage events (LLM, voice, SMS)
- **Cost-Plus Pricing**: Apply configurable markup (percentage + fixed) per metric
- **Tiered Overage**: Support multiple pricing tiers beyond included allowances
- **Caps and Limits**: Enforce minimum/maximum charges per billing cycle

## Component Architecture

```mermaid
graph TB
    subgraph "External Payment Providers"
        STRIPE[Stripe API]
        PAYPAL[PayPal API]
        STRIPE_WH[Stripe Webhooks]
        PAYPAL_WH[PayPal Webhooks]
    end
    
    subgraph "Payments Component"
        API[Payment API<br/>NestJS REST]
        WEBHOOK[Webhook Receiver<br/>Signature Verification]
        
        subgraph "Core Services"
            CUSTOMER[Customer Service<br/>Provider Mapping]
            SUBSCRIPTION[Subscription Service<br/>Lifecycle Management]
            USAGE[Usage Service<br/>Event Aggregation]
            BILLING[Billing Engine<br/>Invoice Generation]
            RECONCILE[Reconciliation Service<br/>Disputes & Refunds]
        end
        
        subgraph "Provider Adapters"
            STRIPE_ADAPTER[Stripe Adapter<br/>IPaymentProviderPort]
            PAYPAL_ADAPTER[PayPal Adapter<br/>IPaymentProviderPort]
        end
        
        subgraph "Supporting Services"
            VALUATION[Valuation Service<br/>IInvoiceValuation]
            VERIFIER[Webhook Verifier<br/>IWebhookVerifier]
            LEDGER[Ledger Service<br/>Immutable Entries]
            IDEMPOTENCY[Idempotency Service<br/>Event Dedup]
        end
        
        DB[(Payments DB<br/>Customers<br/>Subscriptions<br/>Invoices<br/>Ledger)]
        CACHE[(Redis Cache<br/>Event IDs<br/>Idempotency)]
        QUEUE[(Event Queue<br/>Usage Events<br/>Webhook Processing)]
    end
    
    subgraph "Downstream Components"
        BILLING_USAGE[Billing-Usage Service<br/>Usage Event Source]
        NOTIFICATIONS[Notification Service<br/>Invoice Alerts]
        PORTAL[Portal UI<br/>Invoice Display]
    end
    
    %% External provider connections
    API -->|Create Customer<br/>Create Subscription| STRIPE_ADAPTER
    API -->|Payment Methods| PAYPAL_ADAPTER
    STRIPE_ADAPTER -->|Stripe SDK| STRIPE
    PAYPAL_ADAPTER -->|PayPal SDK| PAYPAL
    
    STRIPE_WH -->|Payment Events| WEBHOOK
    PAYPAL_WH -->|Payment Events| WEBHOOK
    
    %% Internal service flows
    WEBHOOK -->|Verify Signature| VERIFIER
    WEBHOOK -->|Check Duplicate| IDEMPOTENCY
    WEBHOOK -->|Enqueue Event| QUEUE
    
    API -->|Manage Customers| CUSTOMER
    API -->|Manage Subscriptions| SUBSCRIPTION
    API -->|Record Usage| USAGE
    API -->|Finalize Invoices| BILLING
    
    CUSTOMER -->|Use Adapter| STRIPE_ADAPTER
    CUSTOMER -->|Use Adapter| PAYPAL_ADAPTER
    SUBSCRIPTION -->|Use Adapter| STRIPE_ADAPTER
    SUBSCRIPTION -->|Use Adapter| PAYPAL_ADAPTER
    
    USAGE -->|Aggregate Events| BILLING
    BILLING -->|Calculate Charges| VALUATION
    BILLING -->|Record Transaction| LEDGER
    
    RECONCILE -->|Query Ledger| LEDGER
    RECONCILE -->|Update Invoices| DB
    
    %% Data persistence
    CUSTOMER --> DB
    SUBSCRIPTION --> DB
    USAGE --> DB
    BILLING --> DB
    RECONCILE --> DB
    LEDGER --> DB
    IDEMPOTENCY --> CACHE
    
    %% Downstream integration
    BILLING_USAGE -->|Usage Events| QUEUE
    BILLING -->|Invoice Created| NOTIFICATIONS
    PORTAL -->|Query Invoices| API
    
    classDef external fill:#e1f5ff,stroke:#01579b
    classDef service fill:#fff3e0,stroke:#e65100
    classDef adapter fill:#f3e5f5,stroke:#4a148c
    classDef storage fill:#e8f5e9,stroke:#1b5e20
    
    class STRIPE,PAYPAL,STRIPE_WH,PAYPAL_WH external
    class CUSTOMER,SUBSCRIPTION,USAGE,BILLING,RECONCILE,VALUATION,VERIFIER,LEDGER,IDEMPOTENCY service
    class STRIPE_ADAPTER,PAYPAL_ADAPTER adapter
    class DB,CACHE,QUEUE storage
```

## Component Responsibilities

### Payment API

**Purpose**: Expose REST endpoints for payment operations (customers, subscriptions, usage, invoices)

**Key Responsibilities**:
- Validate incoming requests (authentication, schema validation)
- Route operations to appropriate services
- Handle idempotency keys for client retries
- Return standardized responses with correlation IDs
- Enforce rate limiting and authorization (RBAC)

**Dependencies**: Customer Service, Subscription Service, Usage Service, Billing Engine

### Webhook Receiver

**Purpose**: Accept and verify incoming webhooks from payment providers

**Key Responsibilities**:
- Verify webhook signatures (Stripe HMAC SHA-256, PayPal signature)
- Validate timestamp freshness (reject stale webhooks)
- Check for replay attacks (event ID deduplication)
- Normalize provider events to canonical PaymentEvent schema
- Enqueue events for asynchronous processing
- Return 200 OK quickly to avoid retries

**Dependencies**: Webhook Verifier, Idempotency Service, Event Queue

### Customer Service

**Purpose**: Manage payment customer records and provider mapping

**Key Responsibilities**:
- Create customers in payment provider (via adapter)
- Map tenants/clients to provider customer IDs
- Store customer metadata (tenant_id, client_id, provider, provider_customer_id)
- Handle customer updates (email, metadata)
- Support multi-provider scenarios (same client, different providers)
- Ensure idempotent customer creation (UNIQUE constraint on tenant + client + provider)

**Dependencies**: Payment Provider Adapters, Payments DB

### Subscription Service

**Purpose**: Manage subscription lifecycle (create, update, cancel, reactivate)

**Key Responsibilities**:
- Create subscriptions via payment provider adapter
- Track subscription state (active, canceled, past_due, paused)
- Handle subscription changes (plan upgrades, downgrades)
- Process subscription lifecycle events (renewal, cancellation)
- Manage billing periods and proration logic
- Store subscription metadata (plan_id, period, status)

**Dependencies**: Payment Provider Adapters, Customer Service, Payments DB

### Usage Service

**Purpose**: Collect and aggregate usage events for metered billing

**Key Responsibilities**:
- Accept usage events from billing-usage component (LLM tokens, voice minutes, SMS)
- Validate usage event schema (metric_key, quantity, vendor_cost, client_id, agent_id)
- Store raw usage events with timestamps
- Aggregate usage by metric per billing cycle
- Handle late-arriving usage data (within billing period)
- Support usage queries and reporting

**Dependencies**: Event Queue, Payments DB

### Billing Engine

**Purpose**: Generate invoices from subscriptions and usage data

**Key Responsibilities**:
- Aggregate usage events per billing cycle
- Apply pricing rules (subscription base, included allowances, overage, tiers, caps)
- Calculate line items (subscription, usage, credits, refunds)
- Invoke valuation service for cost-plus calculations
- Generate invoice records with line items
- Finalize invoices and trigger payment collection
- Record ledger entries for all financial transactions
- Handle invoice amendments and void operations

**Dependencies**: Usage Service, Valuation Service, Ledger Service, Subscription Service, Payments DB

### Reconciliation Service

**Purpose**: Reconcile payments, handle disputes and refunds

**Key Responsibilities**:
- Match payment provider events to internal invoices
- Detect payment failures and retry logic
- Process chargebacks and disputes
- Handle refund requests (full/partial)
- Update invoice status based on payment outcomes
- Generate reconciliation reports
- Alert on discrepancies between provider and internal state

**Dependencies**: Payment Provider Adapters, Ledger Service, Payments DB

### Valuation Service (IInvoiceValuation)

**Purpose**: Apply pricing logic to usage events and line items

**Key Responsibilities**:
- Implement cost-plus pricing (vendor_cost × (1 + markup_percent) + markup_fixed)
- Support tiered pricing (different rates for usage brackets)
- Apply included allowances (deduct from billable usage)
- Enforce caps (minimum/maximum charges per cycle)
- Handle promotional credits and discounts
- Provide deterministic, testable pricing calculations
- Support multiple valuation strategies per metric

**Dependencies**: None (pure calculation logic)

### Webhook Verifier (IWebhookVerifier)

**Purpose**: Verify authenticity of incoming webhooks

**Key Responsibilities**:
- Verify Stripe webhook signatures (HMAC SHA-256 with secret)
- Verify PayPal webhook signatures (certificate-based)
- Validate timestamp freshness (reject events older than 5 minutes)
- Use timing-safe comparison to prevent timing attacks
- Return verification result (success/failure with reason)

**Dependencies**: Provider webhook secrets (from environment/secrets manager)

### Ledger Service

**Purpose**: Maintain immutable audit trail of all financial transactions

**Key Responsibilities**:
- Record debit/credit entries for all financial events
- Link entries to source events (invoice_id, payment_id, refund_id)
- Support double-entry bookkeeping semantics
- Enable transaction history queries and audit reports
- Ensure ledger immutability (append-only, no updates/deletes)
- Track correlation IDs for distributed tracing

**Dependencies**: Payments DB (ledger_entries table)

### Idempotency Service

**Purpose**: Prevent duplicate processing of events and API calls

**Key Responsibilities**:
- Track processed event IDs in Redis cache (24h TTL)
- Check for duplicate events before processing
- Store idempotency keys for API calls (client-provided)
- Return cached response for duplicate API calls
- Clean up expired idempotency records automatically

**Dependencies**: Redis Cache

## Payment Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as Portal UI
    participant API as Payment API
    participant Customer as Customer Service
    participant Subscription as Subscription Service
    participant Stripe as Stripe Adapter
    participant StripeAPI as Stripe API
    participant Webhook as Webhook Receiver
    participant Queue as Event Queue
    participant Billing as Billing Engine
    participant Ledger as Ledger Service
    
    %% Customer creation
    Client->>API: POST /payments/customers<br/>{tenant_id, client_id, email}
    API->>Customer: createCustomer(tenant, client, email)
    Customer->>Stripe: createCustomer(email)
    Stripe->>StripeAPI: POST /v1/customers
    StripeAPI-->>Stripe: {id: cus_xxx}
    Stripe-->>Customer: {provider_customer_id: cus_xxx}
    Customer->>Customer: Store mapping<br/>(tenant, client, stripe, cus_xxx)
    Customer-->>API: {customerId: uuid}
    API-->>Client: 201 {customerId}
    
    %% Subscription creation
    Client->>API: POST /payments/subscriptions<br/>{customerId, planId}
    API->>Subscription: createSubscription(customer, plan)
    Subscription->>Stripe: createSubscription(cus_xxx, plan)
    Stripe->>StripeAPI: POST /v1/subscriptions
    StripeAPI-->>Stripe: {id: sub_xxx, status: active}
    Stripe-->>Subscription: {provider_subscription_id: sub_xxx}
    Subscription->>Subscription: Store subscription<br/>(customer, plan, sub_xxx, active)
    Subscription-->>API: {subscriptionId: uuid}
    API-->>Client: 201 {subscriptionId}
    
    %% Usage recording
    Note over Client,Ledger: During billing cycle...
    Client->>API: POST /payments/usage<br/>{subscriptionId, metric, quantity, vendor_cost}
    API->>Queue: Enqueue usage event
    Queue-->>API: Accepted
    API-->>Client: 202 Accepted
    
    %% Invoice finalization (end of billing cycle)
    Note over API,Ledger: End of billing cycle
    API->>Billing: finalizeInvoice(subscriptionId)
    Billing->>Billing: Aggregate usage events
    Billing->>Billing: Apply pricing rules<br/>(subscription + overage)
    Billing->>Billing: Generate line items
    Billing->>Ledger: Record debit entry<br/>(invoice total)
    Ledger-->>Billing: Ledger entry created
    Billing->>Stripe: createInvoice(sub_xxx, line_items)
    Stripe->>StripeAPI: POST /v1/invoices
    StripeAPI-->>Stripe: {id: in_xxx, status: open}
    Stripe-->>Billing: {provider_invoice_id: in_xxx}
    Billing->>Billing: Store invoice<br/>(subscription, in_xxx, open)
    Billing-->>API: {invoiceId: uuid}
    API-->>Client: 200 {invoiceId}
    
    %% Payment success webhook
    Note over StripeAPI,Ledger: Customer pays invoice
    StripeAPI->>Webhook: POST /ingress/payments/stripe<br/>invoice.payment_succeeded
    Webhook->>Webhook: Verify signature
    Webhook->>Webhook: Check idempotency
    Webhook->>Queue: Enqueue PaymentEvent
    Queue-->>Webhook: Queued
    Webhook-->>StripeAPI: 200 OK
    
    Queue->>Billing: Process PaymentEvent
    Billing->>Billing: Update invoice status<br/>(open → paid)
    Billing->>Ledger: Record credit entry<br/>(payment received)
    Ledger-->>Billing: Ledger entry created
    Billing->>Client: Notify invoice paid<br/>(via notification service)
```

## Integration Points

### Upstream Dependencies

| System | Purpose | Interface |
|--------|---------|-----------|
| **Portal UI** | Customer/subscription management, invoice display | REST API |
| **Billing-Usage Service** | Usage event source (LLM, voice, SMS metrics) | Event queue |
| **IAM Service** | Authentication, authorization (RBAC) | REST API / Shared DB |

### Downstream Dependencies

| System | Purpose | Interface |
|--------|---------|-----------|
| **Stripe API** | Payment processing, customer management, invoicing | REST API + Webhooks |
| **PayPal API** | Alternative payment provider (Phase 2+) | REST API + Webhooks |
| **Notification Service** | Invoice alerts, payment confirmations | Event queue |
| **Audit Service** | Financial audit logs, compliance reporting | Event stream |

### Internal Dependencies

| Component | Purpose |
|-----------|---------|
| **PostgreSQL** | Persistent storage (customers, subscriptions, invoices, ledger) |
| **Redis** | Idempotency cache, event deduplication |
| **Event Queue (Redis/Bull)** | Asynchronous usage event processing, webhook handling |

## Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Framework** | NestJS | Dependency injection, modular architecture, TypeScript |
| **Database** | PostgreSQL | ACID compliance, JSON support, strong constraints |
| **Cache** | Redis | TTL-based idempotency, high-performance key-value storage |
| **Queue** | Bull (Redis-backed) | Reliable job queue, retry logic, job prioritization |
| **Payment Provider (MVP)** | Stripe | Industry-leading API, webhooks, hosted checkout |
| **Payment Provider (Phase 2)** | PayPal | Alternative payment method support |
| **Schema Validation** | JSON Schema (Ajv) | Contract validation for API/webhook payloads |
| **HTTP Client** | Axios | Provider API integration with retry/timeout |
| **Testing** | Jest + Supertest | Unit, integration, contract tests |

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Latency (P95)** | < 200ms | Request duration histogram |
| **Webhook Processing (P95)** | < 100ms (return 200 OK) | Webhook response time |
| **Usage Valuation (P95)** | < 100ms per 100 line items | Valuation duration metric |
| **Invoice Finalization (P95)** | < 1s | Invoice generation duration |
| **Throughput** | 100 usage events/sec sustained | Event processing rate |

### Reliability

| Requirement | Implementation |
|-------------|----------------|
| **Idempotency** | Event ID deduplication (Redis 24h TTL), API idempotency keys |
| **Retry Logic** | Exponential backoff for provider API calls (3 attempts, 1s → 2s → 4s) |
| **Circuit Breaker** | Fail fast after 5 consecutive provider failures, 30s recovery window |
| **Webhook Tolerance** | Accept late webhooks (up to 5 minutes), deduplicate duplicates |
| **Data Consistency** | Database transactions for multi-step operations, ledger append-only |

### Security

| Requirement | Implementation |
|-------------|----------------|
| **PCI Compliance** | SAQ-A posture: no card data handling, use hosted payment pages |
| **Webhook Verification** | HMAC signature validation (Stripe), certificate validation (PayPal) |
| **Replay Protection** | Timestamp validation (5-minute window), event ID deduplication |
| **Authorization** | RBAC enforcement via IAM service, tenant isolation |
| **Secrets Management** | Provider API keys stored in secrets manager, not environment variables |
| **Audit Trail** | Immutable ledger entries, correlation IDs for tracing |

### Observability

| Signal | Implementation |
|--------|----------------|
| **Metrics** | payments_events_total{provider,type}, valuation_duration_ms, invoices_finalized_total, provider_api_errors_total |
| **Logs** | Structured JSON logs with tenant_id, client_id, provider, invoice_id, correlation_id |
| **Traces** | Distributed tracing with OpenTelemetry, span for valuation/finalize operations |
| **Alerts** | Provider API errors > 5/min, invoice finalization failures, payment failures |

## Error Scenarios

### Payment Provider Errors

| Scenario | Error Code | Recovery Strategy |
|----------|------------|-------------------|
| Stripe API unavailable | 502.provider_error_stripe | Retry with exponential backoff, circuit breaker |
| PayPal API timeout | 502.provider_error_paypal | Retry with exponential backoff, circuit breaker |
| Invalid provider credentials | 401.provider_auth_failed | Alert ops, block operations until resolved |
| Rate limit exceeded | 429.provider_rate_limit | Backoff and retry, reduce request rate |

### Webhook Processing Errors

| Scenario | Error Code | Recovery Strategy |
|----------|------------|-------------------|
| Invalid signature | 401.signature_invalid | Return 401, do not process event |
| Stale timestamp | 400.timestamp_stale | Return 400, ignore event |
| Duplicate event | 409.duplicate_event | Return 200 (already processed), log duplicate |
| Unknown event type | 400.unknown_event_type | Return 200, log for investigation |

### Business Logic Errors

| Scenario | Error Code | Recovery Strategy |
|----------|------------|-------------------|
| Customer not found | 404.customer_not_found | Return 404, client must create customer first |
| Subscription not found | 404.subscription_not_found | Return 404, client must create subscription first |
| Invalid subscription state | 409.subscription_state_conflict | Return 409 with current state, client retries |
| Usage event schema invalid | 400.schema_invalid | Return 400 with validation errors, discard event |
| Invoice already finalized | 409.invoice_already_finalized | Return 409, no changes made |

### Data Consistency Errors

| Scenario | Error Code | Recovery Strategy |
|----------|------------|-------------------|
| Database constraint violation | 500.constraint_violation | Log error, return 500, investigate data integrity |
| Ledger imbalance detected | 500.ledger_imbalance | Alert ops, halt invoice finalization, audit ledger |
| Concurrent modification | 409.concurrent_modification | Return 409, client retries with latest data |

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer<br/>HTTPS/TLS]
        
        subgraph "Payment Service Instances"
            API1[Payment API<br/>Instance 1]
            API2[Payment API<br/>Instance 2]
            API3[Payment API<br/>Instance 3]
        end
        
        subgraph "Background Workers"
            WORKER1[Usage Worker<br/>Instance 1]
            WORKER2[Usage Worker<br/>Instance 2]
        end
        
        DB_PRIMARY[(PostgreSQL<br/>Primary)]
        DB_REPLICA[(PostgreSQL<br/>Read Replica)]
        REDIS[(Redis Cluster<br/>Idempotency + Queue)]
        
        SECRETS[Secrets Manager<br/>Provider API Keys]
    end
    
    subgraph "External Services"
        STRIPE_API[Stripe API]
        PAYPAL_API[PayPal API]
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> DB_PRIMARY
    API2 --> DB_PRIMARY
    API3 --> DB_PRIMARY
    
    API1 --> DB_REPLICA
    API2 --> DB_REPLICA
    API3 --> DB_REPLICA
    
    API1 --> REDIS
    API2 --> REDIS
    API3 --> REDIS
    
    WORKER1 --> REDIS
    WORKER2 --> REDIS
    
    WORKER1 --> DB_PRIMARY
    WORKER2 --> DB_PRIMARY
    
    API1 --> SECRETS
    API2 --> SECRETS
    API3 --> SECRETS
    WORKER1 --> SECRETS
    WORKER2 --> SECRETS
    
    API1 --> STRIPE_API
    API2 --> STRIPE_API
    API3 --> STRIPE_API
    
    API1 --> PAYPAL_API
    API2 --> PAYPAL_API
    API3 --> PAYPAL_API
    
    classDef service fill:#fff3e0,stroke:#e65100
    classDef storage fill:#e8f5e9,stroke:#1b5e20
    classDef external fill:#e1f5ff,stroke:#01579b
    
    class API1,API2,API3,WORKER1,WORKER2 service
    class DB_PRIMARY,DB_REPLICA,REDIS,SECRETS storage
    class STRIPE_API,PAYPAL_API external
```

### Deployment Configuration

| Component | Instances | Resources | Scaling Strategy |
|-----------|-----------|-----------|------------------|
| **Payment API** | 3+ | 2 CPU, 4GB RAM | Horizontal auto-scaling based on CPU/requests |
| **Usage Workers** | 2+ | 1 CPU, 2GB RAM | Horizontal scaling based on queue depth |
| **PostgreSQL** | 1 primary + 1 replica | 4 CPU, 16GB RAM | Read queries routed to replica |
| **Redis Cluster** | 3 nodes | 2GB RAM each | Clustered for high availability |

### Environment Variables

```bash
# Provider Credentials (from secrets manager)
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# Database
DATABASE_URL=postgresql://user:pass@host:5432/payments
DATABASE_REPLICA_URL=postgresql://user:pass@replica-host:5432/payments

# Redis
REDIS_URL=redis://redis-cluster:6379

# Service Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
CORRELATION_ID_HEADER=X-Correlation-ID
```

## Next Steps

Proceed to detailed documentation:

1. **[Data Model](./data-model.md)** - Database schema, ERDs, constraints
2. **[API Contracts](./api-contracts.md)** - REST endpoints, request/response schemas
3. **[Stripe Adapter](./stripe-adapter.md)** - Stripe-specific implementation
4. **[Billing Engine](./billing-engine.md)** - Invoice generation and valuation logic
5. **[Reconciliation](./reconciliation.md)** - Payment matching and dispute handling
