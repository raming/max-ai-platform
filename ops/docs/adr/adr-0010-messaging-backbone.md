# ADR-0010: Messaging Backbone and Asynchronous Work

Status: Accepted
Date: 2025-01-06
Deciders: Architecture Team

## Context

The MaxAI Platform requires a reliable asynchronous processing backbone to handle multiple concurrent workloads with different reliability and performance requirements.

### Key Requirements

**Functional Requirements**:
- **Webhook Processing**: Handle incoming webhooks from Retell, GHL, Twilio, and payment providers
- **Orchestration**: Execute declarative flows with adapter calls and retries
- **Integration Tasks**: External API calls with resilience patterns
- **Notifications**: Email, SMS, and internal notifications
- **Analytics**: Usage collection, billing aggregation, and reporting

**Non-Functional Requirements**:
- **Reliability**: > 99.9% job success rate with comprehensive retry strategies
- **Performance**: 5,000+ jobs/minute sustained throughput
- **Latency**: < 60 seconds P95 for business-critical flows
- **Multi-tenancy**: Tenant isolation and resource quotas
- **Observability**: Full tracing, metrics, and audit trails
- **Scalability**: Linear scaling with workload growth

### Current Architecture Constraints

**Existing Components**:
- **n8n**: Visual workflow engine for complex multi-step processes
- **PostgreSQL**: Primary data store with ACID requirements
- **Redis**: Caching and session storage (already deployed)
- **Nx Monorepo**: NestJS services with shared libraries

**Integration Patterns**:
- Webhook ingress → normalize → orchestrate → adapters
- Declarative flows with n8n delegation for complex branches
- Multi-provider adapters with swappable implementations

## Decision

### 1. Primary Message Backbone: BullMQ + Redis

**Core Decision**: Use BullMQ (Redis-based) as the primary job queue for all asynchronous processing

**Implementation Strategy**:
- **5 Primary Queues**: ingress-events, orchestration-flows, integration-tasks, notifications, analytics-events
- **Comprehensive Retry Logic**: Exponential backoff with queue-specific configurations
- **Dead Letter Queues**: Automatic DLQ routing with 30-day retention
- **Idempotency**: SHA-256 content hashing with 24-hour deduplication
- **Multi-tenant Isolation**: Tenant context in all jobs with resource quotas

### 2. Workflow Engine Integration

**n8n Integration Pattern**: BullMQ jobs trigger n8n workflows for complex processing
- **Use Cases**: Multi-step workflows, human-in-the-loop, visual flow design
- **Data Flow**: BullMQ → n8n Webhook → n8n Workflow → BullMQ Response
- **Delegation**: Complex flows delegate to n8n via integration queue

### 3. Progressive Scaling Strategy

**Phase 1 (Current)**: BullMQ/Redis foundation
- Suitable for < 10K messages/minute
- Simple operational model
- Rapid development and deployment

**Phase 2 Migration Triggers**: RabbitMQ when scale demands
- \> 50,000 messages/minute sustained
- Complex routing patterns needed
- Advanced monitoring requirements

**Phase 3 Migration Triggers**: Kafka for event streaming
- \> 1 million events/hour
- Event sourcing patterns
- Real-time analytics requirements

## Alternatives Considered

### 1. RabbitMQ as Primary Queue

**Pros**:
- Mature message broker with advanced routing
- Excellent monitoring and management tools
- Strong durability and clustering support
- Rich ecosystem and community

**Cons**:
- Higher operational complexity (additional service)
- Over-engineering for Phase 1 requirements
- Steeper learning curve for development team
- Additional infrastructure costs

**Decision**: Deferred to Phase 2 when scale justifies complexity

### 2. Apache Kafka as Primary Queue

**Pros**:
- Exceptional throughput and scalability
- Built-in event streaming capabilities
- Strong ecosystem for analytics
- Event sourcing support

**Cons**:
- Significant operational overhead
- Over-engineering for current scale
- Complex configuration and tuning
- High infrastructure costs

**Decision**: Deferred to Phase 3 for event streaming needs

### 3. AWS SQS/SNS as Primary Queue

**Pros**:
- Fully managed with zero operational overhead
- Native cloud integration
- Built-in scaling and reliability
- Cost-effective at scale

**Cons**:
- Vendor lock-in concerns
- Limited customization options
- Potential latency for complex workflows
- Cost unpredictability with usage spikes

**Decision**: Rejected due to portability requirements and cost concerns

### 4. Direct Database Queue (PostgreSQL)

**Pros**:
- Reuses existing infrastructure
- ACID transaction support
- Simple operational model
- Strong consistency guarantees

**Cons**:
- Performance limitations for high throughput
- Database resource contention
- Limited retry and DLQ capabilities
- Polling overhead and latency

**Decision**: Rejected due to performance and scalability concerns

### 5. n8n as Primary Queue

**Pros**:
- Visual workflow design
- Existing team familiarity
- Rich integration ecosystem
- Human-in-the-loop support

**Cons**:
- Not designed as a general-purpose message broker
- Limited retry and error handling
- Performance constraints for high volume
- Complex monitoring and debugging

**Decision**: Retained as workflow engine, not suitable as primary queue

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)

**Core Infrastructure**:
- Redis cluster setup with high availability
- BullMQ installation and basic queue configuration
- Worker templates and job processing patterns
- Basic monitoring and logging integration

**Queue Implementation**:
- All 5 primary queues with DLQ configuration
- Retry strategies and idempotency management
- Basic admin tools and operational procedures

### Phase 2: Production Features (Weeks 3-4)

**Advanced Features**:
- Multi-tenant resource management
- Comprehensive monitoring dashboard
- Performance optimization and tuning
- Security hardening and access controls

**Operations and Monitoring**:
- Alerting and automated responses
- Performance benchmarking and load testing
- Documentation and operational runbooks

### Phase 3: Scale and Optimize (Weeks 5-6)

**Production Readiness**:
- Security review and compliance validation
- Disaster recovery and backup procedures
- Final performance validation
- Go-live preparation and team training

## Consequences

### Positive Outcomes

**Technical Benefits**:
- **Rapid Implementation**: Leverages existing Redis infrastructure
- **High Performance**: 5,000+ jobs/minute with sub-60s latency
- **Operational Simplicity**: Single additional service (minimal overhead)
- **Cost Efficiency**: < $500/month infrastructure for Phase 1 scale
- **Developer Experience**: Rich TypeScript ecosystem and tooling

**Architectural Benefits**:
- **Clear Separation**: Job queues (BullMQ) vs workflows (n8n) vs persistence (PostgreSQL)
- **Progressive Complexity**: Start simple, evolve to enterprise brokers when needed
- **Multi-tenant Support**: Built-in isolation and resource management
- **Observability**: Complete tracing and audit capabilities

**Business Benefits**:
- **Faster Time to Market**: 6-week implementation vs 12+ weeks for enterprise solutions
- **Lower Risk**: Proven technology with extensive production use
- **Team Productivity**: Minimal learning curve for Node.js developers

### Negative Consequences

**Technical Limitations**:
- **Scaling Ceiling**: Will require migration at > 50K msgs/minute
- **Feature Constraints**: Limited compared to enterprise message brokers
- **Single Point of Failure**: Redis dependency (mitigated by clustering)

**Operational Overhead**:
- **Redis Management**: Additional service to monitor and maintain
- **Migration Complexity**: Future migration to RabbitMQ/Kafka when scale demands
- **Monitoring Requirements**: Need comprehensive observability implementation

### Risk Mitigation

**Scaling Risks**:
- **Monitoring**: Track throughput and latency trends for proactive scaling
- **Migration Planning**: Document clear migration triggers and procedures
- **Load Testing**: Regular performance benchmarking to identify limits

**Operational Risks**:
- **High Availability**: Redis clustering and automatic failover
- **Backup Strategy**: Regular snapshots and point-in-time recovery
- **Circuit Breakers**: Prevent cascade failures with timeout and fallback patterns

**Development Risks**:
- **Documentation**: Comprehensive implementation guides and runbooks
- **Testing**: Unit, integration, and performance test suites
- **Monitoring**: Real-time visibility into queue health and performance

## Success Metrics

### Technical Metrics

**Performance Targets**:
- **Throughput**: > 5,000 jobs/minute sustained
- **Latency**: P95 < 60 seconds for business flows
- **Reliability**: > 99.9% job success rate
- **Availability**: > 99.95% queue system uptime

**Operational Targets**:
- **Recovery Time**: < 5 minutes to recover from failures
- **Monitoring**: 100% job visibility and tracing
- **Administration**: < 10 minutes for routine operations
- **Cost Efficiency**: < $500/month for Phase 1 scale

### Business Metrics

**User Experience**:
- **Flow Completion**: > 99% end-to-end flow success rate
- **Response Time**: < 30 seconds for user-facing operations
- **Error Recovery**: Automatic recovery for > 95% of failures

**Development Efficiency**:
- **Implementation Speed**: 6-week delivery timeline
- **Team Onboarding**: < 1 week for new developers
- **Operational Overhead**: < 2 hours/week manual intervention

## Migration Strategy

### RabbitMQ Migration (Phase 2)

**Migration Triggers**:
- Message volume > 50,000/minute sustained
- Complex routing requirements
- Advanced monitoring needs

**Migration Approach**:
1. **Parallel Deployment**: Run BullMQ and RabbitMQ side-by-side
2. **Selective Migration**: Move high-volume queues first
3. **Gradual Cutover**: Queue-by-queue migration with rollback capability
4. **Decommission**: Remove BullMQ after complete validation

**Estimated Timeline**: 4-6 weeks for complete migration

### Kafka Migration (Phase 3)

**Migration Triggers**:
- Event volume > 1 million/hour
- Event sourcing requirements
- Real-time analytics needs

**Migration Approach**:
1. **Hybrid Architecture**: Kafka for events, RabbitMQ for jobs
2. **Event Sourcing**: Migrate to event-driven architecture
3. **Stream Processing**: Add real-time analytics capabilities
4. **Cross-service Events**: Implement event broadcasting

**Estimated Timeline**: 8-12 weeks for event streaming architecture

## References

### Internal Documentation
- [Messaging Backbone Architecture Specification](../design/messaging-backbone-architecture-spec.md)
- [Usage Aggregation ADR](./adr-0002-usage-aggregation.md)
- [Declarative Flows ADR](./adr-0005-declarative-flows.md)
- [Architecture Overview](../design/architecture-overview.md)
- [Phase 1 Release Plan](../release/phase-1.md)

### External References
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ vs Redis Comparison](https://www.cloudamqp.com/blog/when-to-use-rabbitmq-or-apache-kafka.html)
- [Node.js Queue Best Practices](https://github.com/goldbergyoni/nodebestpractices#-47-prefer-native-js-methods-over-user-land-utils-like-lodash)

## Change History

- **2025-01-06**: Complete architectural decision with comprehensive analysis
- **Initial**: Basic BullMQ proposal for job queue functionality
