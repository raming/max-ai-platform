# Billing/Usage Collectors Architecture Specification

## Overview

This document provides the complete architectural specification for the MaxAI Platform billing and usage collection system, designed to aggregate multi-source usage data across Retell AI, Twilio, OpenRouter, and other providers for accurate cost attribution and billing.

## Executive Summary

**Objective**: Design and implement a robust, multi-provider usage collection system that captures usage events from external services, aggregates them into billing cycles, and provides accurate cost attribution per client and agent.

**Core Requirements**:
- **Multi-Provider Support**: Retell AI, Twilio, OpenRouter with extensible architecture
- **Cost Attribution**: Per-client, per-agent usage tracking with vendor unit costs
- **Billing Integration**: Support for subscription + cost-plus + included allowances model
- **Scheduling**: Phase 1 via n8n cron, Phase 2 via BullMQ with DLQ and retries
- **Security**: Credential isolation, log redaction, audit trails, PII protection

## Canonical Data Model

### UsageEvent Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://maxai.com/schemas/usage-event.json",
  "title": "Usage Event",
  "description": "Canonical usage event from external providers",
  "type": "object",
  "required": [
    "event_id",
    "provider",
    "event_type",
    "metric_key",
    "quantity",
    "unit",
    "tenant_id",
    "client_id",
    "timestamp",
    "vendor_cost_data",
    "collection_metadata"
  ],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for this usage event"
    },
    "provider": {
      "type": "string",
      "enum": ["retell", "twilio", "openrouter", "hubspot", "google", "microsoft"],
      "description": "Usage provider identifier"
    },
    "event_type": {
      "type": "string",
      "description": "Provider-specific event type",
      "examples": ["call_completed", "sms_sent", "token_consumed", "api_request"]
    },
    "metric_key": {
      "type": "string",
      "description": "Standardized metric for billing calculation",
      "examples": ["retell.call_minutes", "twilio.sms_count", "openrouter.input_tokens", "openrouter.output_tokens"]
    },
    "quantity": {
      "type": "number",
      "minimum": 0,
      "description": "Quantity of usage in metric units"
    },
    "unit": {
      "type": "string",
      "description": "Unit of measurement",
      "examples": ["minutes", "count", "tokens", "requests", "bytes"]
    },
    "tenant_id": {
      "type": "string",
      "format": "uuid",
      "description": "Tenant identifier for multi-tenancy"
    },
    "client_id": {
      "type": "string",
      "format": "uuid",
      "description": "Client identifier within tenant"
    },
    "agent_id": {
      "type": "string",
      "format": "uuid",
      "description": "Agent identifier (if applicable)",
      "nullable": true
    },
    "resource_id": {
      "type": "string",
      "description": "Provider-specific resource identifier",
      "examples": ["call_id", "message_sid", "request_id"]
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Event timestamp (ISO 8601)"
    },
    "vendor_cost_data": {
      "type": "object",
      "required": ["unit_cost", "currency", "cost_captured_at"],
      "properties": {
        "unit_cost": {
          "type": "number",
          "minimum": 0,
          "description": "Vendor unit cost at time of capture"
        },
        "currency": {
          "type": "string",
          "pattern": "^[A-Z]{3}$",
          "description": "Currency code (ISO 4217)"
        },
        "cost_captured_at": {
          "type": "string",
          "format": "date-time",
          "description": "Timestamp when cost was captured"
        },
        "total_cost": {
          "type": "number",
          "minimum": 0,
          "description": "Total cost for this event (quantity * unit_cost)"
        },
        "pricing_tier": {
          "type": "string",
          "description": "Vendor pricing tier (if applicable)"
        }
      },
      "additionalProperties": false
    },
    "collection_metadata": {
      "type": "object",
      "required": ["collected_at", "collector_version"],
      "properties": {
        "collected_at": {
          "type": "string",
          "format": "date-time",
          "description": "When this event was collected by our system"
        },
        "collector_version": {
          "type": "string",
          "description": "Version of the collector that captured this event"
        },
        "correlation_id": {
          "type": "string",
          "format": "uuid",
          "description": "Correlation ID for tracing"
        },
        "retry_count": {
          "type": "integer",
          "minimum": 0,
          "default": 0,
          "description": "Number of collection retry attempts"
        },
        "source_pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer",
              "minimum": 1
            },
            "page_size": {
              "type": "integer",
              "minimum": 1
            },
            "total_pages": {
              "type": "integer",
              "minimum": 1
            }
          }
        }
      },
      "additionalProperties": false
    },
    "provider_metadata": {
      "type": "object",
      "description": "Provider-specific additional data",
      "additionalProperties": true
    },
    "tags": {
      "type": "object",
      "description": "Custom tags for categorization",
      "additionalProperties": {
        "type": "string"
      }
    }
  },
  "additionalProperties": false
}
```

### CycleAggregate Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://maxai.com/schemas/cycle-aggregate.json",
  "title": "Cycle Aggregate",
  "description": "Aggregated usage data for billing cycles",
  "type": "object",
  "required": [
    "aggregate_id",
    "tenant_id",
    "client_id",
    "metric_key",
    "cycle_start",
    "cycle_end",
    "total_quantity",
    "total_cost",
    "event_count",
    "aggregated_at"
  ],
  "properties": {
    "aggregate_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for this aggregate"
    },
    "tenant_id": {
      "type": "string",
      "format": "uuid",
      "description": "Tenant identifier"
    },
    "client_id": {
      "type": "string",
      "format": "uuid",
      "description": "Client identifier"
    },
    "agent_id": {
      "type": "string",
      "format": "uuid",
      "description": "Agent identifier (null for client-level aggregates)",
      "nullable": true
    },
    "provider": {
      "type": "string",
      "enum": ["retell", "twilio", "openrouter", "hubspot", "google", "microsoft"],
      "description": "Usage provider"
    },
    "metric_key": {
      "type": "string",
      "description": "Metric being aggregated"
    },
    "unit": {
      "type": "string",
      "description": "Unit of measurement"
    },
    "cycle_start": {
      "type": "string",
      "format": "date-time",
      "description": "Start of billing cycle"
    },
    "cycle_end": {
      "type": "string",
      "format": "date-time",
      "description": "End of billing cycle"
    },
    "total_quantity": {
      "type": "number",
      "minimum": 0,
      "description": "Total quantity consumed in cycle"
    },
    "total_cost": {
      "type": "number",
      "minimum": 0,
      "description": "Total vendor cost for cycle"
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "description": "Currency code"
    },
    "event_count": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of events in this aggregate"
    },
    "aggregated_at": {
      "type": "string",
      "format": "date-time",
      "description": "When aggregation was computed"
    },
    "cost_breakdown": {
      "type": "object",
      "properties": {
        "average_unit_cost": {
          "type": "number",
          "minimum": 0
        },
        "min_unit_cost": {
          "type": "number",
          "minimum": 0
        },
        "max_unit_cost": {
          "type": "number",
          "minimum": 0
        },
        "cost_variance": {
          "type": "number",
          "minimum": 0,
          "description": "Statistical variance in unit costs"
        }
      }
    },
    "quality_metrics": {
      "type": "object",
      "properties": {
        "completeness_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Percentage of expected events captured"
        },
        "late_events_count": {
          "type": "integer",
          "minimum": 0,
          "description": "Events that arrived after initial aggregation"
        },
        "anomaly_flags": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["high_usage_spike", "cost_anomaly", "missing_events", "duplicate_events"]
          }
        }
      }
    },
    "reconciliation": {
      "type": "object",
      "properties": {
        "reconciled": {
          "type": "boolean",
          "default": false
        },
        "reconciled_at": {
          "type": "string",
          "format": "date-time"
        },
        "discrepancies": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": ["quantity_mismatch", "cost_mismatch", "missing_events"]
              },
              "description": {
                "type": "string"
              },
              "impact": {
                "type": "number"
              }
            }
          }
        }
      }
    }
  },
  "additionalProperties": false
}
```

## Database Architecture

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USAGE EVENTS                            │
├─────────────────────────────────────────────────────────────────┤
│ PK event_id              UUID                                   │
│    provider              VARCHAR(50) NOT NULL                   │
│    event_type           VARCHAR(100) NOT NULL                   │
│    metric_key           VARCHAR(100) NOT NULL                   │
│    quantity             DECIMAL(18,6) NOT NULL                  │
│    unit                 VARCHAR(50) NOT NULL                    │
│ FK tenant_id            UUID NOT NULL                           │
│ FK client_id            UUID NOT NULL                           │
│ FK agent_id             UUID NULL                               │
│    resource_id          VARCHAR(255)                            │
│    event_timestamp      TIMESTAMP NOT NULL                      │
│    vendor_cost_data     JSONB NOT NULL                          │
│    collection_metadata  JSONB NOT NULL                          │
│    provider_metadata    JSONB                                   │
│    tags                 JSONB                                   │
│    created_at           TIMESTAMP DEFAULT NOW()                 │
│    updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:N
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CYCLE AGGREGATES                           │
├─────────────────────────────────────────────────────────────────┤
│ PK aggregate_id         UUID                                    │
│ FK tenant_id            UUID NOT NULL                           │
│ FK client_id            UUID NOT NULL                           │
│ FK agent_id             UUID NULL                               │
│    provider             VARCHAR(50) NOT NULL                    │
│    metric_key           VARCHAR(100) NOT NULL                   │
│    unit                 VARCHAR(50) NOT NULL                    │
│    cycle_start          TIMESTAMP NOT NULL                      │
│    cycle_end            TIMESTAMP NOT NULL                      │
│    total_quantity       DECIMAL(18,6) NOT NULL                  │
│    total_cost           DECIMAL(18,6) NOT NULL                  │
│    currency             VARCHAR(3) NOT NULL                     │
│    event_count          INTEGER NOT NULL                        │
│    aggregated_at        TIMESTAMP NOT NULL                      │
│    cost_breakdown       JSONB                                   │
│    quality_metrics      JSONB                                   │
│    reconciliation       JSONB                                   │
│    created_at           TIMESTAMP DEFAULT NOW()                 │
│    updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ N:1
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USAGE SOURCES                               │
├─────────────────────────────────────────────────────────────────┤
│ PK source_id            UUID                                    │
│    provider             VARCHAR(50) UNIQUE NOT NULL             │
│    display_name         VARCHAR(100) NOT NULL                   │
│    api_endpoint         VARCHAR(255) NOT NULL                   │
│    auth_type            VARCHAR(50) NOT NULL                    │
│    rate_limit_per_min   INTEGER                                 │
│    rate_limit_per_hour  INTEGER                                 │
│    max_page_size        INTEGER                                 │
│    default_lookback_hrs INTEGER DEFAULT 24                      │
│    is_active            BOOLEAN DEFAULT TRUE                    │
│    config               JSONB                                   │
│    created_at           TIMESTAMP DEFAULT NOW()                 │
│    updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:N
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  COLLECTION_RUNS                               │
├─────────────────────────────────────────────────────────────────┤
│ PK run_id               UUID                                    │
│ FK source_id            UUID NOT NULL                           │
│    trigger_type         VARCHAR(50) NOT NULL                    │
│    scheduled_at         TIMESTAMP                               │
│    started_at           TIMESTAMP                               │
│    completed_at         TIMESTAMP                               │
│    status               VARCHAR(50) NOT NULL                    │
│    events_collected     INTEGER DEFAULT 0                       │
│    events_processed     INTEGER DEFAULT 0                       │
│    events_failed        INTEGER DEFAULT 0                       │
│    error_details        JSONB                                   │
│    performance_metrics  JSONB                                   │
│    correlation_id       UUID                                    │
│    created_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ N:1
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                CLIENT_AGENT_MAPPINGS                           │
├─────────────────────────────────────────────────────────────────┤
│ PK mapping_id           UUID                                    │
│ FK tenant_id            UUID NOT NULL                           │
│ FK client_id            UUID NOT NULL                           │
│ FK agent_id             UUID NOT NULL                           │
│    provider             VARCHAR(50) NOT NULL                    │
│    provider_agent_id    VARCHAR(255) NOT NULL                   │
│    agent_name           VARCHAR(255)                            │
│    is_active            BOOLEAN DEFAULT TRUE                    │
│    metadata             JSONB                                   │
│    created_at           TIMESTAMP DEFAULT NOW()                 │
│    updated_at           TIMESTAMP DEFAULT NOW()                 │
│                                                                 │
│ UNIQUE(tenant_id, client_id, provider, provider_agent_id)      │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (PostgreSQL)

```sql
-- Usage Events Table
CREATE TABLE usage_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    metric_key VARCHAR(100) NOT NULL,
    quantity DECIMAL(18,6) NOT NULL CHECK (quantity >= 0),
    unit VARCHAR(50) NOT NULL,
    tenant_id UUID NOT NULL,
    client_id UUID NOT NULL,
    agent_id UUID,
    resource_id VARCHAR(255),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    vendor_cost_data JSONB NOT NULL,
    collection_metadata JSONB NOT NULL,
    provider_metadata JSONB,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_usage_events_tenant_client ON usage_events(tenant_id, client_id);
CREATE INDEX idx_usage_events_provider_metric ON usage_events(provider, metric_key);
CREATE INDEX idx_usage_events_timestamp ON usage_events(event_timestamp);
CREATE INDEX idx_usage_events_agent ON usage_events(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_usage_events_resource ON usage_events(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX idx_usage_events_collection_time ON usage_events((collection_metadata->>'collected_at'));

-- GIN index for JSONB fields
CREATE INDEX idx_usage_events_vendor_cost_gin ON usage_events USING GIN(vendor_cost_data);
CREATE INDEX idx_usage_events_collection_gin ON usage_events USING GIN(collection_metadata);
CREATE INDEX idx_usage_events_tags_gin ON usage_events USING GIN(tags);

-- Cycle Aggregates Table  
CREATE TABLE cycle_aggregates (
    aggregate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    client_id UUID NOT NULL,
    agent_id UUID,
    provider VARCHAR(50) NOT NULL,
    metric_key VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
    cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_quantity DECIMAL(18,6) NOT NULL CHECK (total_quantity >= 0),
    total_cost DECIMAL(18,6) NOT NULL CHECK (total_cost >= 0),
    currency VARCHAR(3) NOT NULL,
    event_count INTEGER NOT NULL CHECK (event_count >= 0),
    aggregated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cost_breakdown JSONB,
    quality_metrics JSONB,
    reconciliation JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique aggregates per cycle/client/metric
    CONSTRAINT uq_cycle_aggregates UNIQUE (tenant_id, client_id, agent_id, provider, metric_key, cycle_start, cycle_end)
);

-- Indexes for cycle aggregates
CREATE INDEX idx_cycle_aggregates_tenant_client ON cycle_aggregates(tenant_id, client_id);
CREATE INDEX idx_cycle_aggregates_cycle_period ON cycle_aggregates(cycle_start, cycle_end);
CREATE INDEX idx_cycle_aggregates_provider_metric ON cycle_aggregates(provider, metric_key);
CREATE INDEX idx_cycle_aggregates_agent ON cycle_aggregates(agent_id) WHERE agent_id IS NOT NULL;

-- Usage Sources Table
CREATE TABLE usage_sources (
    source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('api_key', 'oauth2', 'bearer_token', 'basic_auth')),
    rate_limit_per_min INTEGER CHECK (rate_limit_per_min > 0),
    rate_limit_per_hour INTEGER CHECK (rate_limit_per_hour > 0),
    max_page_size INTEGER DEFAULT 100 CHECK (max_page_size > 0),
    default_lookback_hrs INTEGER DEFAULT 24 CHECK (default_lookback_hrs > 0),
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection Runs Table
CREATE TABLE collection_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES usage_sources(source_id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('scheduled', 'manual', 'retry', 'backfill')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    events_collected INTEGER DEFAULT 0 CHECK (events_collected >= 0),
    events_processed INTEGER DEFAULT 0 CHECK (events_processed >= 0),
    events_failed INTEGER DEFAULT 0 CHECK (events_failed >= 0),
    error_details JSONB,
    performance_metrics JSONB,
    correlation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for collection runs
CREATE INDEX idx_collection_runs_source ON collection_runs(source_id);
CREATE INDEX idx_collection_runs_status ON collection_runs(status);
CREATE INDEX idx_collection_runs_scheduled ON collection_runs(scheduled_at);
CREATE INDEX idx_collection_runs_correlation ON collection_runs(correlation_id);

-- Client Agent Mappings Table
CREATE TABLE client_agent_mappings (
    mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    client_id UUID NOT NULL,
    agent_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_agent_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique mapping per tenant/client/provider/external agent
    CONSTRAINT uq_client_agent_mappings UNIQUE (tenant_id, client_id, provider, provider_agent_id)
);

-- Indexes for client agent mappings
CREATE INDEX idx_client_agent_mappings_tenant_client ON client_agent_mappings(tenant_id, client_id);
CREATE INDEX idx_client_agent_mappings_provider ON client_agent_mappings(provider);
CREATE INDEX idx_client_agent_mappings_agent ON client_agent_mappings(agent_id);
```

## Multi-Provider Collector Architecture

### Collector Framework

```typescript
// Base collector interface
export interface IUsageCollector {
  readonly providerId: string;
  readonly displayName: string;
  
  // Core collection methods
  collect(params: CollectionParams): Promise<CollectionResult>;
  validateCredentials(): Promise<boolean>;
  getMetricDefinitions(): Promise<MetricDefinition[]>;
  
  // Pagination support
  getPageSize(): number;
  supportsDateRange(): boolean;
  getMaxLookbackDays(): number;
  
  // Rate limiting
  getRateLimits(): RateLimitConfig;
  
  // Health check
  healthCheck(): Promise<HealthStatus>;
}

interface CollectionParams {
  tenantId: string;
  clientId: string;
  startDate: Date;
  endDate: Date;
  cursor?: string;
  pageSize?: number;
  correlationId: string;
}

interface CollectionResult {
  events: UsageEvent[];
  nextCursor?: string;
  hasMore: boolean;
  totalCollected: number;
  performance: {
    collectionTimeMs: number;
    apiCallCount: number;
    rateLimitRemaining?: number;
    rateLimitResetAt?: Date;
  };
}
```

### Provider-Specific Collectors

#### Retell AI Collector

```typescript
export class RetellUsageCollector implements IUsageCollector {
  readonly providerId = 'retell';
  readonly displayName = 'Retell AI';
  
  private readonly apiClient: RetellApiClient;
  private readonly rateLimiter: RateLimiter;
  
  constructor(
    private readonly config: RetellCollectorConfig,
    private readonly credentialService: ICredentialService,
    private readonly logger: ILogger
  ) {
    this.apiClient = new RetellApiClient(config);
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 60,  // Retell rate limit
      requestsPerHour: 1000
    });
  }
  
  async collect(params: CollectionParams): Promise<CollectionResult> {
    const startTime = Date.now();
    let apiCallCount = 0;
    const events: UsageEvent[] = [];
    
    try {
      // Get client's agent mappings
      const agentMappings = await this.getAgentMappings(params.tenantId, params.clientId);
      
      // Collect call data for each agent
      for (const mapping of agentMappings) {
        const calls = await this.collectCallsForAgent(
          mapping.provider_agent_id,
          params.startDate,
          params.endDate,
          params.cursor
        );
        apiCallCount++;
        
        // Transform calls to usage events
        for (const call of calls.data) {
          const event = this.transformCallToUsageEvent(call, mapping, params.correlationId);
          events.push(event);
        }
      }
      
      // Get current pricing for cost attribution
      const pricing = await this.getCurrentPricing();
      apiCallCount++;
      
      // Enrich events with vendor cost data
      events.forEach(event => {
        this.enrichWithCostData(event, pricing);
      });
      
      return {
        events,
        nextCursor: calls.nextCursor,
        hasMore: calls.hasMore,
        totalCollected: events.length,
        performance: {
          collectionTimeMs: Date.now() - startTime,
          apiCallCount,
          rateLimitRemaining: calls.rateLimitRemaining,
          rateLimitResetAt: calls.rateLimitResetAt
        }
      };
      
    } catch (error) {
      this.logger.error('Retell collection failed', {
        error: error.message,
        correlationId: params.correlationId,
        tenantId: params.tenantId,
        clientId: params.clientId
      });
      throw error;
    }
  }
  
  private transformCallToUsageEvent(
    call: RetellCall, 
    mapping: ClientAgentMapping,
    correlationId: string
  ): UsageEvent {
    return {
      event_id: generateUUID(),
      provider: 'retell',
      event_type: 'call_completed',
      metric_key: 'retell.call_minutes',
      quantity: call.duration_seconds / 60, // Convert to minutes
      unit: 'minutes',
      tenant_id: mapping.tenant_id,
      client_id: mapping.client_id,
      agent_id: mapping.agent_id,
      resource_id: call.call_id,
      timestamp: new Date(call.end_timestamp).toISOString(),
      vendor_cost_data: {
        unit_cost: 0, // Will be enriched later
        currency: 'USD',
        cost_captured_at: new Date().toISOString(),
        total_cost: 0,
        pricing_tier: call.pricing_tier
      },
      collection_metadata: {
        collected_at: new Date().toISOString(),
        collector_version: '1.0.0',
        correlation_id: correlationId,
        retry_count: 0
      },
      provider_metadata: {
        call_type: call.call_type,
        from_number: call.from_number,
        to_number: call.to_number,
        recording_url: call.recording_url,
        transcript_length: call.transcript?.length || 0
      },
      tags: {
        call_direction: call.direction,
        call_status: call.status
      }
    };
  }
  
  private async getCurrentPricing(): Promise<RetellPricing> {
    // Implementation to fetch current Retell pricing
    // This should be cached and refreshed periodically
    return this.pricingCache.get('retell') || await this.fetchPricingFromRetell();
  }
  
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/agent/list');
      return response.status === 200;
    } catch {
      return false;
    }
  }
  
  getMetricDefinitions(): Promise<MetricDefinition[]> {
    return Promise.resolve([
      {
        key: 'retell.call_minutes',
        displayName: 'Call Minutes',
        unit: 'minutes',
        description: 'Total minutes of voice calls processed',
        category: 'voice'
      }
    ]);
  }
  
  getRateLimits(): RateLimitConfig {
    return {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      burstCapacity: 10
    };
  }
}
```

#### Twilio Collector

```typescript
export class TwilioUsageCollector implements IUsageCollector {
  readonly providerId = 'twilio';
  readonly displayName = 'Twilio';
  
  private readonly client: Twilio;
  private readonly rateLimiter: RateLimiter;
  
  constructor(
    private readonly config: TwilioCollectorConfig,
    private readonly credentialService: ICredentialService,
    private readonly logger: ILogger
  ) {
    const credentials = this.credentialService.get(config.credentialId);
    this.client = new Twilio(credentials.sid, credentials.authToken);
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 3600,  // Twilio rate limit
      requestsPerSecond: 60
    });
  }
  
  async collect(params: CollectionParams): Promise<CollectionResult> {
    const startTime = Date.now();
    let apiCallCount = 0;
    const events: UsageEvent[] = [];
    
    try {
      // Collect SMS usage
      const smsUsage = await this.collectSMSUsage(params);
      events.push(...smsUsage.events);
      apiCallCount += smsUsage.apiCalls;
      
      // Collect voice usage
      const voiceUsage = await this.collectVoiceUsage(params);
      events.push(...voiceUsage.events);
      apiCallCount += voiceUsage.apiCalls;
      
      // Get current Twilio pricing
      const pricing = await this.getCurrentPricing();
      apiCallCount++;
      
      // Enrich with cost data
      events.forEach(event => {
        this.enrichWithTwilioCosts(event, pricing);
      });
      
      return {
        events,
        hasMore: false, // Twilio usage API doesn't typically paginate the same way
        totalCollected: events.length,
        performance: {
          collectionTimeMs: Date.now() - startTime,
          apiCallCount
        }
      };
      
    } catch (error) {
      this.logger.error('Twilio collection failed', {
        error: error.message,
        correlationId: params.correlationId,
        tenantId: params.tenantId,
        clientId: params.clientId
      });
      throw error;
    }
  }
  
  private async collectSMSUsage(params: CollectionParams) {
    const messages = await this.client.messages.list({
      dateCreatedAfter: params.startDate,
      dateCreatedBefore: params.endDate,
      limit: params.pageSize || 1000
    });
    
    const events = messages.map(message => this.transformSMSToUsageEvent(message, params));
    
    return {
      events,
      apiCalls: 1
    };
  }
  
  private transformSMSToUsageEvent(message: MessageInstance, params: CollectionParams): UsageEvent {
    return {
      event_id: generateUUID(),
      provider: 'twilio',
      event_type: 'sms_sent',
      metric_key: 'twilio.sms_count',
      quantity: 1,
      unit: 'count',
      tenant_id: params.tenantId,
      client_id: params.clientId,
      agent_id: null,
      resource_id: message.sid,
      timestamp: message.dateCreated.toISOString(),
      vendor_cost_data: {
        unit_cost: 0, // Will be enriched
        currency: 'USD',
        cost_captured_at: new Date().toISOString(),
        total_cost: 0
      },
      collection_metadata: {
        collected_at: new Date().toISOString(),
        collector_version: '1.0.0',
        correlation_id: params.correlationId,
        retry_count: 0
      },
      provider_metadata: {
        message_status: message.status,
        message_direction: message.direction,
        from: message.from,
        to: message.to,
        num_segments: message.numSegments,
        num_media: message.numMedia
      }
    };
  }
}
```

#### OpenRouter Collector

```typescript
export class OpenRouterUsageCollector implements IUsageCollector {
  readonly providerId = 'openrouter';
  readonly displayName = 'OpenRouter';
  
  private readonly httpClient: AxiosInstance;
  
  constructor(
    private readonly config: OpenRouterCollectorConfig,
    private readonly credentialService: ICredentialService,
    private readonly logger: ILogger
  ) {
    const apiKey = this.credentialService.get(config.credentialId);
    this.httpClient = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async collect(params: CollectionParams): Promise<CollectionResult> {
    const startTime = Date.now();
    let apiCallCount = 0;
    const events: UsageEvent[] = [];
    
    try {
      // Get usage data from OpenRouter
      const response = await this.httpClient.get('/activity', {
        params: {
          start: params.startDate.toISOString(),
          end: params.endDate.toISOString(),
          limit: params.pageSize || 1000
        }
      });
      apiCallCount++;
      
      const activities = response.data.data;
      
      for (const activity of activities) {
        // Create separate events for input and output tokens
        if (activity.tokens_prompt > 0) {
          events.push(this.createTokenUsageEvent(
            activity, 
            'input_tokens', 
            activity.tokens_prompt,
            params
          ));
        }
        
        if (activity.tokens_completion > 0) {
          events.push(this.createTokenUsageEvent(
            activity, 
            'output_tokens', 
            activity.tokens_completion,
            params
          ));
        }
      }
      
      return {
        events,
        hasMore: response.data.has_more,
        nextCursor: response.data.cursor,
        totalCollected: events.length,
        performance: {
          collectionTimeMs: Date.now() - startTime,
          apiCallCount
        }
      };
      
    } catch (error) {
      this.logger.error('OpenRouter collection failed', {
        error: error.message,
        correlationId: params.correlationId
      });
      throw error;
    }
  }
  
  private createTokenUsageEvent(
    activity: any, 
    tokenType: 'input_tokens' | 'output_tokens',
    tokenCount: number,
    params: CollectionParams
  ): UsageEvent {
    const cost = tokenType === 'input_tokens' ? 
      activity.native_tokens_prompt_cost : 
      activity.native_tokens_completion_cost;
      
    return {
      event_id: generateUUID(),
      provider: 'openrouter',
      event_type: 'tokens_consumed',
      metric_key: `openrouter.${tokenType}`,
      quantity: tokenCount,
      unit: 'tokens',
      tenant_id: params.tenantId,
      client_id: params.clientId,
      agent_id: null,
      resource_id: activity.id,
      timestamp: new Date(activity.created_at).toISOString(),
      vendor_cost_data: {
        unit_cost: cost / tokenCount,
        currency: 'USD',
        cost_captured_at: new Date().toISOString(),
        total_cost: cost
      },
      collection_metadata: {
        collected_at: new Date().toISOString(),
        collector_version: '1.0.0',
        correlation_id: params.correlationId,
        retry_count: 0
      },
      provider_metadata: {
        model: activity.model,
        app_id: activity.app_id,
        referer: activity.referer,
        generation_time: activity.generation_time,
        tokens_total: activity.tokens_prompt + activity.tokens_completion
      }
    };
  }
}
```

### Collector Registry and Factory

```typescript
@Injectable()
export class CollectorRegistry {
  private readonly collectors = new Map<string, () => IUsageCollector>();
  
  constructor(
    private readonly credentialService: ICredentialService,
    private readonly configService: IConfigService,
    private readonly logger: ILogger
  ) {
    this.registerCollectors();
  }
  
  private registerCollectors(): void {
    // Register all available collectors
    this.collectors.set('retell', () => new RetellUsageCollector(
      this.configService.get('collectors.retell'),
      this.credentialService,
      this.logger
    ));
    
    this.collectors.set('twilio', () => new TwilioUsageCollector(
      this.configService.get('collectors.twilio'),
      this.credentialService,
      this.logger
    ));
    
    this.collectors.set('openrouter', () => new OpenRouterUsageCollector(
      this.configService.get('collectors.openrouter'),
      this.credentialService,
      this.logger
    ));
  }
  
  getCollector(providerId: string): IUsageCollector {
    const factory = this.collectors.get(providerId);
    if (!factory) {
      throw new Error(`No collector registered for provider: ${providerId}`);
    }
    return factory();
  }
  
  getAvailableProviders(): string[] {
    return Array.from(this.collectors.keys());
  }
  
  async validateAllCredentials(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [providerId] of this.collectors) {
      try {
        const collector = this.getCollector(providerId);
        const isValid = await collector.validateCredentials();
        results.set(providerId, isValid);
      } catch (error) {
        this.logger.error(`Credential validation failed for ${providerId}`, { error });
        results.set(providerId, false);
      }
    }
    
    return results;
  }
}
```

## Scheduling and Orchestration

### Phase 1: n8n Integration

```typescript
// n8n workflow configuration for usage collection
export const usageCollectionWorkflow = {
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 2 * * *" // Daily at 2 AM UTC
            }
          ]
        }
      },
      "position": [250, 300]
    },
    {
      "id": "collect-retell",
      "name": "Collect Retell Usage",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.BILLING_USAGE_SERVICE_URL}}/api/v1/collect/retell",
        "authentication": "headerAuth",
        "headerAuth": {
          "name": "Authorization",
          "value": "Bearer {{$env.BILLING_USAGE_SERVICE_TOKEN}}"
        },
        "body": {
          "lookbackHours": 25, // Slightly more than 24h for overlap
          "correlationId": "{{$json.id}}"
        }
      },
      "position": [450, 200]
    },
    {
      "id": "collect-twilio",
      "name": "Collect Twilio Usage",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.BILLING_USAGE_SERVICE_URL}}/api/v1/collect/twilio",
        "authentication": "headerAuth",
        "headerAuth": {
          "name": "Authorization",
          "value": "Bearer {{$env.BILLING_USAGE_SERVICE_TOKEN}}"
        },
        "body": {
          "lookbackHours": 25,
          "correlationId": "{{$json.id}}"
        }
      },
      "position": [450, 300]
    },
    {
      "id": "collect-openrouter",
      "name": "Collect OpenRouter Usage",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.BILLING_USAGE_SERVICE_URL}}/api/v1/collect/openrouter",
        "authentication": "headerAuth",
        "headerAuth": {
          "name": "Authorization",
          "value": "Bearer {{$env.BILLING_USAGE_SERVICE_TOKEN}}"
        },
        "body": {
          "lookbackHours": 25,
          "correlationId": "{{$json.id}}"
        }
      },
      "position": [450, 400]
    },
    {
      "id": "aggregate-daily",
      "name": "Aggregate Daily Usage",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.BILLING_USAGE_SERVICE_URL}}/api/v1/aggregate/daily",
        "authentication": "headerAuth",
        "headerAuth": {
          "name": "Authorization",
          "value": "Bearer {{$env.BILLING_USAGE_SERVICE_TOKEN}}"
        },
        "body": {
          "date": "{{$now.minus({days: 1}).toFormat('yyyy-MM-dd')}}",
          "correlationId": "{{$json.id}}"
        }
      },
      "position": [650, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Collect Retell Usage",
            "type": "main",
            "index": 0
          },
          {
            "node": "Collect Twilio Usage",
            "type": "main",
            "index": 0
          },
          {
            "node": "Collect OpenRouter Usage",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Collect Retell Usage": {
      "main": [
        [
          {
            "node": "Aggregate Daily Usage",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Collect Twilio Usage": {
      "main": [
        [
          {
            "node": "Aggregate Daily Usage",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Collect OpenRouter Usage": {
      "main": [
        [
          {
            "node": "Aggregate Daily Usage",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};
```

### Phase 2: BullMQ Integration

```typescript
// BullMQ job definitions for usage collection
@Processor('usage-collection')
export class UsageCollectionProcessor {
  constructor(
    private readonly collectorRegistry: CollectorRegistry,
    private readonly usageEventService: UsageEventService,
    private readonly aggregationService: AggregationService,
    private readonly logger: ILogger
  ) {}
  
  @Process('collect-provider')
  async processProviderCollection(job: Job<ProviderCollectionJobData>): Promise<void> {
    const { providerId, tenantId, clientId, correlationId, lookbackHours } = job.data;
    
    try {
      const collector = this.collectorRegistry.getCollector(providerId);
      
      const endDate = new Date();
      const startDate = new Date(Date.now() - (lookbackHours * 60 * 60 * 1000));
      
      let cursor: string | undefined;
      let totalCollected = 0;
      
      do {
        const result = await collector.collect({
          tenantId,
          clientId,
          startDate,
          endDate,
          cursor,
          correlationId
        });
        
        // Store events in database
        await this.usageEventService.bulkCreate(result.events);
        
        totalCollected += result.events.length;
        cursor = result.nextCursor;
        
        // Update job progress
        job.updateProgress((totalCollected / (result.totalCollected || totalCollected)) * 100);
        
        // Rate limiting - respect provider limits
        if (result.performance.rateLimitRemaining && result.performance.rateLimitRemaining < 10) {
          const waitTime = result.performance.rateLimitResetAt?.getTime() - Date.now() || 60000;
          this.logger.info(`Rate limit near, waiting ${waitTime}ms`, { providerId, correlationId });
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
      } while (cursor);
      
      this.logger.info('Provider collection completed', {
        providerId,
        tenantId,
        clientId,
        totalCollected,
        correlationId
      });
      
    } catch (error) {
      this.logger.error('Provider collection failed', {
        providerId,
        tenantId,
        clientId,
        error: error.message,
        correlationId
      });
      throw error;
    }
  }
  
  @Process('aggregate-usage')
  async processUsageAggregation(job: Job<AggregationJobData>): Promise<void> {
    const { date, tenantId, clientId, correlationId } = job.data;
    
    try {
      const aggregates = await this.aggregationService.aggregateDaily({
        date: new Date(date),
        tenantId,
        clientId,
        correlationId
      });
      
      this.logger.info('Usage aggregation completed', {
        date,
        tenantId,
        clientId,
        aggregateCount: aggregates.length,
        correlationId
      });
      
    } catch (error) {
      this.logger.error('Usage aggregation failed', {
        date,
        tenantId,
        clientId,
        error: error.message,
        correlationId
      });
      throw error;
    }
  }
}

// Job scheduling service
@Injectable()
export class UsageCollectionScheduler {
  constructor(
    @InjectQueue('usage-collection') private readonly queue: Queue,
    private readonly tenantService: ITenantService,
    private readonly logger: ILogger
  ) {}
  
  async scheduleDailyCollection(): Promise<void> {
    const tenants = await this.tenantService.getActiveTenants();
    
    for (const tenant of tenants) {
      const clients = await this.tenantService.getClients(tenant.id);
      
      for (const client of clients) {
        const correlationId = generateUUID();
        
        // Schedule collection for each provider
        const providers = ['retell', 'twilio', 'openrouter'];
        for (const providerId of providers) {
          await this.queue.add('collect-provider', {
            providerId,
            tenantId: tenant.id,
            clientId: client.id,
            correlationId,
            lookbackHours: 25
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 60000, // 1 minute
            },
            removeOnComplete: 100,
            removeOnFail: 50
          });
        }
        
        // Schedule aggregation after collection (with delay)
        await this.queue.add('aggregate-usage', {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tenantId: tenant.id,
          clientId: client.id,
          correlationId
        }, {
          delay: 30 * 60 * 1000, // 30 minute delay to ensure collection is complete
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 120000, // 2 minutes
          }
        });
      }
    }
  }
}
```

```

## Security and Credential Management

### Credential Storage and Isolation

```typescript
// Secure credential service interface
export interface ICredentialService {
  store(credentialId: string, credential: ProviderCredential): Promise<void>;
  get(credentialId: string): Promise<ProviderCredential>;
  rotate(credentialId: string, newCredential: ProviderCredential): Promise<void>;
  revoke(credentialId: string): Promise<void>;
  validateCredential(credentialId: string): Promise<boolean>;
}

// Provider credential types
export interface ProviderCredential {
  id: string;
  provider: string;
  type: 'api_key' | 'oauth2' | 'bearer_token' | 'basic_auth';
  data: Record<string, string>;
  tenantId: string;
  clientId?: string;
  expiresAt?: Date;
  isActive: boolean;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt?: Date;
    rotationSchedule?: string;
  };
}

// Credential encryption and storage
@Injectable()
export class SecureCredentialService implements ICredentialService {
  constructor(
    private readonly encryptionService: IEncryptionService,
    private readonly auditService: IAuditService,
    private readonly logger: ILogger
  ) {}
  
  async store(credentialId: string, credential: ProviderCredential): Promise<void> {
    // Encrypt sensitive credential data
    const encryptedData = await this.encryptionService.encrypt(
      JSON.stringify(credential.data),
      `credential-${credentialId}`
    );
    
    // Store in secure vault (e.g., HashiCorp Vault, AWS Secrets Manager)
    await this.vaultService.store(`credentials/${credentialId}`, {
      ...credential,
      data: encryptedData
    });
    
    // Audit log
    await this.auditService.log({
      action: 'credential_stored',
      resourceId: credentialId,
      tenantId: credential.tenantId,
      metadata: { provider: credential.provider }
    });
  }
  
  async get(credentialId: string): Promise<ProviderCredential> {
    const encryptedCredential = await this.vaultService.get(`credentials/${credentialId}`);
    
    if (!encryptedCredential) {
      throw new Error(`Credential not found: ${credentialId}`);
    }
    
    // Decrypt sensitive data
    const decryptedData = await this.encryptionService.decrypt(
      encryptedCredential.data,
      `credential-${credentialId}`
    );
    
    // Update last used timestamp
    await this.updateLastUsed(credentialId);
    
    return {
      ...encryptedCredential,
      data: JSON.parse(decryptedData)
    };
  }
  
  async rotate(credentialId: string, newCredential: ProviderCredential): Promise<void> {
    // Store new credential with versioning
    await this.store(`${credentialId}-v${Date.now()}`, newCredential);
    
    // Keep old credential active for grace period
    setTimeout(() => {
      this.revoke(credentialId);
    }, 24 * 60 * 60 * 1000); // 24 hour grace period
    
    // Audit rotation
    await this.auditService.log({
      action: 'credential_rotated',
      resourceId: credentialId,
      tenantId: newCredential.tenantId
    });
  }
}
```

### Log Redaction and Data Privacy

```typescript
// Secure logger with automatic PII redaction
@Injectable()
export class SecureLogger implements ILogger {
  private readonly piiPatterns = [
    /"api[_-]?key"\s*:\s*"([^"]+)"/gi,
    /"token"\s*:\s*"([^"]+)"/gi,
    /"secret"\s*:\s*"([^"]+)"/gi,
    /"password"\s*:\s*"([^"]+)"/gi,
    /bearer\s+([a-zA-Z0-9\-_\.]+)/gi,
    // Phone number patterns
    /\b\d{3}-\d{3}-\d{4}\b/g,
    /\b\+?1?\d{10}\b/g,
    // Email patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  ];
  
  private redactSensitiveData(data: any): any {
    let stringified = JSON.stringify(data);
    
    // Apply redaction patterns
    for (const pattern of this.piiPatterns) {
      stringified = stringified.replace(pattern, (match, group1) => {
        return match.replace(group1, '*'.repeat(Math.min(group1.length, 8)));
      });
    }
    
    try {
      return JSON.parse(stringified);
    } catch {
      return { _redacted: true, _original_type: typeof data };
    }
  }
  
  info(message: string, data?: any): void {
    const redactedData = data ? this.redactSensitiveData(data) : undefined;
    this.baseLogger.info(message, redactedData);
  }
  
  error(message: string, data?: any): void {
    const redactedData = data ? this.redactSensitiveData(data) : undefined;
    this.baseLogger.error(message, redactedData);
  }
}
```

### Audit Trail Implementation

```typescript
// Comprehensive audit service
@Injectable()
export class UsageCollectionAuditService {
  async logCollectionStart(params: {
    providerId: string;
    tenantId: string;
    clientId: string;
    correlationId: string;
    lookbackHours: number;
  }): Promise<void> {
    await this.auditService.log({
      action: 'usage_collection_started',
      resourceType: 'usage_collection',
      resourceId: params.correlationId,
      tenantId: params.tenantId,
      clientId: params.clientId,
      metadata: {
        provider: params.providerId,
        lookback_hours: params.lookbackHours,
        timestamp: new Date().toISOString()
      },
      correlationId: params.correlationId
    });
  }
  
  async logCollectionComplete(params: {
    providerId: string;
    correlationId: string;
    eventsCollected: number;
    durationMs: number;
    success: boolean;
    error?: string;
  }): Promise<void> {
    await this.auditService.log({
      action: 'usage_collection_completed',
      resourceType: 'usage_collection',
      resourceId: params.correlationId,
      metadata: {
        provider: params.providerId,
        events_collected: params.eventsCollected,
        duration_ms: params.durationMs,
        success: params.success,
        error_message: params.error ? '[REDACTED]' : undefined
      },
      correlationId: params.correlationId
    });
  }
  
  async logAggregationEvent(params: {
    tenantId: string;
    clientId: string;
    date: string;
    aggregatesCreated: number;
    correlationId: string;
  }): Promise<void> {
    await this.auditService.log({
      action: 'usage_aggregation_completed',
      resourceType: 'usage_aggregation',
      resourceId: params.correlationId,
      tenantId: params.tenantId,
      clientId: params.clientId,
      metadata: {
        aggregation_date: params.date,
        aggregates_created: params.aggregatesCreated
      },
      correlationId: params.correlationId
    });
  }
}
```

## PoC Implementation Plan

### Phase 1 PoC: Retell AI Collector

**Objective**: Implement a working Retell AI usage collector with complete end-to-end data flow demonstration.

#### Step 1: Environment Setup (Day 1)

```bash
# 1. Create NestJS billing-usage service
npx @nestjs/cli new billing-usage-service
cd billing-usage-service

# 2. Install required dependencies
npm install --save \
  @nestjs/config \
  @nestjs/typeorm \
  @nestjs/schedule \
  @nestjs/bull \
  typeorm \
  pg \
  redis \
  axios \
  uuid \
  ajv

# 3. Install development dependencies
npm install --save-dev \
  @types/uuid \
  @types/node
```

#### Step 2: Database Schema Implementation (Day 1)

```sql
-- Create PoC database schema
CREATE DATABASE billing_usage_poc;

-- Usage events table (simplified for PoC)
CREATE TABLE usage_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'retell',
    event_type VARCHAR(100) NOT NULL,
    metric_key VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    tenant_id UUID NOT NULL,
    client_id UUID NOT NULL,
    resource_id VARCHAR(255),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    vendor_cost_data JSONB NOT NULL,
    collection_metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes
CREATE INDEX idx_usage_events_tenant_client ON usage_events(tenant_id, client_id);
CREATE INDEX idx_usage_events_timestamp ON usage_events(event_timestamp);

-- Test data for validation
INSERT INTO usage_events (
    event_type, metric_key, quantity, unit, 
    tenant_id, client_id, resource_id, event_timestamp,
    vendor_cost_data, collection_metadata
) VALUES (
    'call_completed', 'retell.call_minutes', 5.5, 'minutes',
    'test-tenant-id', 'test-client-id', 'test-call-123',
    NOW() - INTERVAL '1 hour',
    '{"unit_cost": 0.05, "currency": "USD", "total_cost": 0.275}',
    '{"collected_at": "2024-01-01T10:00:00Z", "collector_version": "1.0.0-poc"}'
);
```

#### Step 3: Core Collector Implementation (Day 2)

```typescript
// src/collectors/retell-collector.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class RetellCollectorService {
  private readonly httpClient: AxiosInstance;
  
  constructor() {
    this.httpClient = axios.create({
      baseURL: 'https://api.retellai.com/v2',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async collectCalls(params: {
    startDate: Date;
    endDate: Date;
    agentId?: string;
  }) {
    try {
      const response = await this.httpClient.get('/call/list', {
        params: {
          start_time: params.startDate.toISOString(),
          end_time: params.endDate.toISOString(),
          agent_id: params.agentId
        }
      });
      
      return response.data.calls || [];
    } catch (error) {
      console.error('Retell API error:', error.message);
      throw error;
    }
  }
  
  transformToUsageEvents(calls: any[], correlationId: string) {
    return calls.map(call => ({
      event_id: this.generateUUID(),
      provider: 'retell',
      event_type: 'call_completed',
      metric_key: 'retell.call_minutes',
      quantity: call.duration_ms / 60000, // Convert ms to minutes
      unit: 'minutes',
      tenant_id: 'poc-tenant',
      client_id: 'poc-client',
      resource_id: call.call_id,
      event_timestamp: new Date(call.end_timestamp),
      vendor_cost_data: {
        unit_cost: 0.05, // Mock pricing
        currency: 'USD',
        total_cost: (call.duration_ms / 60000) * 0.05,
        cost_captured_at: new Date().toISOString()
      },
      collection_metadata: {
        collected_at: new Date().toISOString(),
        collector_version: '1.0.0-poc',
        correlation_id: correlationId,
        retry_count: 0
      }
    }));
  }
  
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
```

#### Step 4: Database Service (Day 2)

```typescript
// src/services/usage-events.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageEvent } from '../entities/usage-event.entity';

@Injectable()
export class UsageEventsService {
  constructor(
    @InjectRepository(UsageEvent)
    private readonly usageEventRepository: Repository<UsageEvent>
  ) {}
  
  async bulkCreate(events: any[]): Promise<UsageEvent[]> {
    const entities = events.map(event => this.usageEventRepository.create(event));
    return await this.usageEventRepository.save(entities);
  }
  
  async findByDateRange(startDate: Date, endDate: Date): Promise<UsageEvent[]> {
    return await this.usageEventRepository.find({
      where: {
        event_timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      order: { event_timestamp: 'DESC' }
    });
  }
  
  async getStats() {
    return await this.usageEventRepository
      .createQueryBuilder('event')
      .select([
        'COUNT(*) as total_events',
        'SUM(quantity) as total_quantity',
        'AVG(quantity) as avg_quantity'
      ])
      .getRawOne();
  }
}
```

#### Step 5: REST API Endpoints (Day 3)

```typescript
// src/controllers/collection.controller.ts
import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { RetellCollectorService } from '../collectors/retell-collector.service';
import { UsageEventsService } from '../services/usage-events.service';

@Controller('api/v1/collection')
export class CollectionController {
  constructor(
    private readonly retellCollector: RetellCollectorService,
    private readonly usageEventsService: UsageEventsService
  ) {}
  
  @Post('retell')
  async collectRetellUsage(@Body() body: {
    lookbackHours?: number;
    correlationId?: string;
  }) {
    const lookbackHours = body.lookbackHours || 24;
    const correlationId = body.correlationId || this.generateUUID();
    
    const endDate = new Date();
    const startDate = new Date(Date.now() - (lookbackHours * 60 * 60 * 1000));
    
    try {
      // Collect from Retell API
      const calls = await this.retellCollector.collectCalls({ startDate, endDate });
      
      // Transform to usage events
      const events = this.retellCollector.transformToUsageEvents(calls, correlationId);
      
      // Store in database
      const savedEvents = await this.usageEventsService.bulkCreate(events);
      
      return {
        success: true,
        correlation_id: correlationId,
        events_collected: savedEvents.length,
        date_range: { start: startDate, end: endDate }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        correlation_id: correlationId
      };
    }
  }
  
  @Get('events')
  async getEvents(
    @Query('start') startDate?: string,
    @Query('end') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const events = await this.usageEventsService.findByDateRange(start, end);
    const stats = await this.usageEventsService.getStats();
    
    return {
      events,
      stats,
      date_range: { start, end }
    };
  }
}
```

#### Step 6: Testing and Validation (Day 3)

```typescript
// test/retell-collector.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Retell Collector E2E', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  it('/api/v1/collection/retell (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/collection/retell')
      .send({ lookbackHours: 1 })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.correlation_id).toBeDefined();
    expect(typeof response.body.events_collected).toBe('number');
  });
  
  it('/api/v1/collection/events (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/collection/events')
      .expect(200);
    
    expect(response.body.events).toBeDefined();
    expect(response.body.stats).toBeDefined();
    expect(Array.isArray(response.body.events)).toBe(true);
  });
});
```

#### Step 7: PoC Demonstration Script (Day 4)

```bash
#!/bin/bash
# poc-demo.sh - Demonstrate end-to-end usage collection

echo "🚀 Starting Billing/Usage Collector PoC Demo"

# 1. Start services
echo "📍 Step 1: Starting PostgreSQL and Redis..."
docker run -d --name poc-postgres \
  -e POSTGRES_PASSWORD=pocpassword \
  -e POSTGRES_DB=billing_usage_poc \
  -p 5432:5432 postgres:15

docker run -d --name poc-redis -p 6379:6379 redis:7-alpine

# 2. Run database migrations
echo "📍 Step 2: Setting up database schema..."
npm run typeorm:migration:run

# 3. Start the application
echo "📍 Step 3: Starting NestJS application..."
npm run start:dev &
APP_PID=$!

# Wait for app to start
sleep 10

# 4. Trigger collection
echo "📍 Step 4: Triggering Retell usage collection..."
CORRELATION_ID=$(uuidgen)
echo "Correlation ID: $CORRELATION_ID"

curl -X POST http://localhost:3000/api/v1/collection/retell \
  -H "Content-Type: application/json" \
  -d "{
    \"lookbackHours\": 2,
    \"correlationId\": \"$CORRELATION_ID\"
  }"

echo ""
echo "📍 Step 5: Waiting for collection to complete..."
sleep 5

# 5. Verify data
echo "📍 Step 6: Retrieving collected usage data..."
curl -X GET "http://localhost:3000/api/v1/collection/events" | jq .

# 6. Generate summary report
echo "📍 Step 7: Generating PoC summary report..."
psql postgresql://postgres:pocpassword@localhost:5432/billing_usage_poc << EOF
SELECT 
  'PoC Summary Report' as title,
  COUNT(*) as total_events,
  SUM(quantity) as total_minutes,
  AVG(quantity) as avg_call_duration,
  MIN(event_timestamp) as earliest_event,
  MAX(event_timestamp) as latest_event,
  SUM((vendor_cost_data->>'total_cost')::decimal) as total_cost
FROM usage_events;
EOF

echo "✅ PoC Demo Complete!"
echo "📊 Check the summary report above for results"

# Cleanup
kill $APP_PID
docker stop poc-postgres poc-redis
docker rm poc-postgres poc-redis
```

### PoC Success Criteria

✅ **Technical Validation**:
- [ ] Successfully authenticate with Retell API
- [ ] Collect at least 10 call records from past 24 hours
- [ ] Transform all records to canonical UsageEvent schema
- [ ] Store events in PostgreSQL with proper indexing
- [ ] Generate accurate cost calculations
- [ ] Complete end-to-end flow in under 30 seconds

✅ **Data Quality Validation**:
- [ ] All required fields populated (no nulls in required columns)
- [ ] Timestamp accuracy (events within expected date range)
- [ ] Cost calculations match expected rates
- [ ] Proper JSON schema validation for JSONB fields
- [ ] Unique event IDs (no duplicates)

✅ **Operational Validation**:
- [ ] Proper error handling for API failures
- [ ] Correlation ID tracking throughout flow
- [ ] Structured logging with no PII exposure
- [ ] Database connection pooling working correctly
- [ ] Memory usage remains stable during collection

## Performance Requirements and Monitoring

### Performance Benchmarks

**Collection Performance**:
- **Throughput**: 10,000 events/minute per collector instance
- **Latency**: < 5 seconds for 1,000 event collection batch
- **API Rate Limits**: Respect provider limits (Retell: 60/min, Twilio: 3600/min)
- **Memory Usage**: < 512MB per collector instance under normal load
- **Database Insert Rate**: > 5,000 events/second bulk insert

**Aggregation Performance**:
- **Daily Aggregation**: Complete within 15 minutes for 100,000 events
- **Query Performance**: < 100ms for tenant usage summaries
- **Index Efficiency**: > 99% index hit ratio for time-range queries

### Monitoring and Alerting

```typescript
// Prometheus metrics collection
@Injectable()
export class MetricsService {
  private readonly collectionDuration = new prometheus.Histogram({
    name: 'usage_collection_duration_seconds',
    help: 'Time spent collecting usage data',
    labelNames: ['provider', 'status']
  });
  
  private readonly eventsCollected = new prometheus.Counter({
    name: 'usage_events_collected_total',
    help: 'Total number of usage events collected',
    labelNames: ['provider', 'metric_key']
  });
  
  private readonly apiErrors = new prometheus.Counter({
    name: 'provider_api_errors_total',
    help: 'Total number of provider API errors',
    labelNames: ['provider', 'error_type']
  });
  
  recordCollectionMetrics(params: {
    provider: string;
    durationMs: number;
    eventsCollected: number;
    success: boolean;
    metricKey?: string;
  }) {
    const durationSeconds = params.durationMs / 1000;
    
    this.collectionDuration
      .labels(params.provider, params.success ? 'success' : 'error')
      .observe(durationSeconds);
      
    if (params.success && params.metricKey) {
      this.eventsCollected
        .labels(params.provider, params.metricKey)
        .inc(params.eventsCollected);
    }
  }
}
```

## Deployment and Operational Guide

### Nx Monorepo Integration

```json
// client/apps/billing-usage/project.json
{
  "name": "billing-usage",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/billing-usage/src",
  "projectType": "application",
  "tags": ["scope:billing", "type:service", "platform:node"],
  "targets": {
    "build": {
      "executor": "@nx/node:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/billing-usage",
        "main": "apps/billing-usage/src/main.ts",
        "tsConfig": "apps/billing-usage/tsconfig.app.json",
        "assets": ["apps/billing-usage/src/assets"]
      }
    },
    "serve": {
      "executor": "@nx/node:execute",
      "options": {
        "buildTarget": "billing-usage:build"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/apps/billing-usage"],
      "options": {
        "jestConfig": "apps/billing-usage/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "e2e": {
      "executor": "@nx/jest:jest",
      "options": {
        "jestConfig": "apps/billing-usage/jest-e2e.config.ts"
      }
    }
  }
}
```

### Docker Configuration

```dockerfile
# apps/billing-usage/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx nx build billing-usage --prod

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/billing-usage ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

USER nestjs

EXPOSE 3000

CMD ["node", "main.js"]
```

### Kubernetes Deployment

```yaml
# k8s/billing-usage-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-usage
  namespace: maxai-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: billing-usage
  template:
    metadata:
      labels:
        app: billing-usage
    spec:
      containers:
      - name: billing-usage
        image: maxai/billing-usage:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: billing-usage-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: billing-usage-secrets
              key: redis-url
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "500m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

This comprehensive specification provides exact implementation guidance for AI agents to build a production-ready billing and usage collection system with complete architectural detail, security considerations, and operational procedures.
