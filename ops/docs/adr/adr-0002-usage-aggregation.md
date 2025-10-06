# ADR-0002: Usage Aggregation and Billing Collection Architecture

Status: Accepted
Date: 2024-10-06
Deciders: Architecture Team

## Context

The MaxAI Platform requires a robust, multi-provider usage collection system that captures usage events from external services (Retell AI, Twilio, OpenRouter) and aggregates them into billing cycles for accurate cost attribution per client and agent.

**Key Requirements**:
- Multi-provider support with extensible collector architecture
- Accurate cost attribution with vendor unit costs captured at event-time
- Support for subscription + cost-plus + included allowances billing model
- Secure credential management and PII protection
- Performance: 10,000+ events/minute throughput
- Auditability and reconciliation capabilities

## Decision

### 1. Multi-Phase Implementation Approach

**Phase 1 (MVP)**: n8n-based scheduling for quick deployment
- Daily cron jobs triggering authenticated API endpoints
- Suitable for initial Phase 1 requirements
- Minimal infrastructure complexity

**Phase 2 (Production Scale)**: BullMQ-based job processing
- Distributed job queues with retry logic and DLQ
- Fine-grained control over collection timing and concurrency
- Better observability and failure handling

### 2. Canonical Data Model

**UsageEvent Schema**:
- Comprehensive event capture with provider-specific metadata
- Vendor cost data captured at collection time for accuracy
- Full attribution chain: tenant → client → agent → resource
- Collection metadata for traceability and debugging

**CycleAggregate Schema**:
- Pre-computed aggregations for billing performance
- Quality metrics and reconciliation tracking
- Cost breakdown analysis for billing accuracy

### 3. Collector Architecture

**Interface-Based Design**:
```typescript
interface IUsageCollector {
  collect(params: CollectionParams): Promise<CollectionResult>;
  validateCredentials(): Promise<boolean>;
  getMetricDefinitions(): Promise<MetricDefinition[]>;
  getRateLimits(): RateLimitConfig;
}
```

**Provider-Specific Collectors**:
- RetellUsageCollector: Voice call minutes with pricing tiers
- TwilioUsageCollector: SMS/Voice usage with multi-metric support
- OpenRouterUsageCollector: Token consumption (input/output separate)

**Registry Pattern**: Centralized collector management with factory instantiation

### 4. Database Design

**PostgreSQL Schema**:
- `usage_events`: Core event storage with JSONB metadata fields
- `cycle_aggregates`: Pre-computed billing aggregations
- `usage_sources`: Provider configuration and rate limits
- `collection_runs`: Execution tracking and performance metrics
- `client_agent_mappings`: Provider-to-internal ID mapping

**Performance Optimizations**:
- Strategic indexing on tenant/client/timestamp
- GIN indexes for JSONB query performance
- Partitioning strategy for large-scale data retention

### 5. Security Architecture

**Credential Management**:
- Encrypted storage in secure vault (HashiCorp Vault/AWS Secrets)
- Credential rotation with grace periods
- Audit logging for all credential operations

**PII Protection**:
- Automatic log redaction using regex patterns
- No sensitive data in application logs
- Secure transmission and storage of provider tokens

**Audit Trail**:
- Complete collection lifecycle tracking
- Correlation ID propagation
- Tamper-evident audit logs

### 6. Implementation Specifications

**PoC Approach**: Retell AI collector as proof-of-concept
- 4-day implementation timeline
- End-to-end validation with real API integration
- Performance benchmarking and success criteria

**Production Requirements**:
- Throughput: 10,000 events/minute per collector
- Latency: < 5 seconds for 1,000 event batches
- Memory: < 512MB per collector instance
- Database: > 5,000 events/second bulk insert rate

## Alternatives Considered

### 1. Event Streaming Architecture (Kafka/EventBridge)
**Pros**: Real-time processing, horizontal scalability
**Cons**: Infrastructure complexity, over-engineering for Phase 1
**Decision**: Deferred to Phase 3 for real-time analytics needs

### 2. Third-Party Usage Analytics Services
**Pros**: Reduced development effort, proven scalability
**Cons**: Vendor lock-in, limited customization, cost concerns
**Decision**: Rejected due to need for custom billing logic integration

### 3. Direct Provider Webhooks
**Pros**: Real-time data, reduced polling overhead
**Cons**: Not all providers support webhooks, reliability concerns
**Decision**: Hybrid approach - use webhooks where available, polling otherwise

### 4. NoSQL Storage (MongoDB/DynamoDB)
**Pros**: Schema flexibility, horizontal scaling
**Cons**: Complex aggregation queries, ACID transaction limitations
**Decision**: PostgreSQL chosen for ACID guarantees and SQL aggregation capabilities

## Consequences

### Positive
- **Scalable Architecture**: Multi-phase approach allows organic growth
- **Billing Accuracy**: Vendor cost capture ensures accurate cost attribution
- **Security Compliance**: Comprehensive credential and PII protection
- **Observability**: Full audit trail and performance monitoring
- **Extensibility**: Interface-based design supports new providers
- **Performance**: Optimized for high-throughput collection and aggregation

### Negative
- **Initial Complexity**: Comprehensive design increases development time
- **Infrastructure Requirements**: Multiple components (DB, Redis, Vault)
- **Monitoring Overhead**: Requires robust observability implementation
- **Provider Dependencies**: Reliability tied to external API availability

### Mitigation Strategies
- **Phased Implementation**: Start simple with n8n, evolve to BullMQ
- **Circuit Breakers**: Implement timeouts and fallback mechanisms
- **Data Reconciliation**: Regular validation against provider billing data
- **Cost Monitoring**: Track collection costs vs. value generated

## Implementation Plan

### Phase 1 (Weeks 1-2): MVP Foundation
- Retell collector PoC implementation
- Basic PostgreSQL schema and indexes
- n8n workflow configuration
- Manual testing and validation

### Phase 2 (Weeks 3-4): Production Hardening
- Twilio and OpenRouter collectors
- BullMQ job processing implementation
- Comprehensive security implementation
- Automated testing and CI/CD integration

### Phase 3 (Weeks 5-6): Scale and Optimize
- Performance optimization and monitoring
- Advanced aggregation and reconciliation
- Admin UI for collection management
- Documentation and operational runbooks

## Success Metrics

### Technical Metrics
- **Collection Accuracy**: > 99.5% event capture rate
- **Performance**: Meet stated throughput and latency requirements
- **Reliability**: < 0.1% error rate in production
- **Cost Efficiency**: Collection costs < 2% of attributed usage value

### Business Metrics
- **Billing Accuracy**: Zero billing disputes due to usage collection errors
- **Revenue Attribution**: 100% usage costs attributed to clients
- **Operational Efficiency**: < 2 hours/week manual intervention required
- **Compliance**: Zero PII exposure incidents

## References

- [Billing Model Documentation](../design/billing-model.md)
- [Architecture Overview](../design/architecture-overview.md)
- [Billing/Usage Collectors Specification](../design/billing-usage-collectors-architecture-spec.md)
- [Phase 1 Release Plan](../release/phase-1.md)
- [Security and Compliance Guidelines](../design/security-compliance.md)

## Change History

- **2024-10-06**: Complete architectural design and implementation specification
- **Initial**: Basic proposal for n8n scheduling approach
