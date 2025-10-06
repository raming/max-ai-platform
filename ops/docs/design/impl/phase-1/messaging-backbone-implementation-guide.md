# Messaging Backbone Implementation Guide

## Purpose

This document provides step-by-step implementation guidance for the MaxAI Platform messaging backbone using BullMQ and Redis, including complete code examples, configuration patterns, and integration specifications.

## Project Structure

### Nx Library Organization

```
client/
├── apps/
│   ├── api-gateway/                    # HTTP API with queue producers
│   ├── webhook-ingress/                # Webhook processor with queue integration
│   └── orchestrator/                   # Flow executor with queue consumers
├── libs/
│   ├── shared/
│   │   ├── messaging/                  # Core messaging infrastructure
│   │   │   ├── src/
│   │   │   │   ├── lib/
│   │   │   │   │   ├── queue-manager.ts
│   │   │   │   │   ├── base-worker.ts
│   │   │   │   │   ├── job-types.ts
│   │   │   │   │   ├── retry-strategies.ts
│   │   │   │   │   └── idempotency.ts
│   │   │   │   └── index.ts
│   │   │   ├── project.json
│   │   │   └── README.md
│   │   └── types/                      # Shared TypeScript interfaces
│   └── workers/
│       ├── ingress-worker/             # Webhook processing workers
│       ├── orchestration-worker/       # Flow execution workers
│       ├── integration-worker/         # External API workers
│       ├── notification-worker/        # Email/SMS workers
│       └── analytics-worker/           # Usage collection workers
```

### Nx Project Configuration

**Messaging Library (`libs/shared/messaging/project.json`)**:
```json
{
  "name": "shared-messaging",
  "type": "library",
  "root": "libs/shared/messaging",
  "projectType": "library",
  "sourceRoot": "libs/shared/messaging/src",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/shared/messaging",
        "main": "libs/shared/messaging/src/index.ts",
        "tsConfig": "libs/shared/messaging/tsconfig.lib.json"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/shared/messaging/jest.config.ts",
        "passWithNoTests": false
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": [
          "libs/shared/messaging/**/*.ts"
        ]
      }
    }
  },
  "tags": ["type:shared", "scope:messaging"]
}
```

## Core Implementation

### 1. Queue Manager (`libs/shared/messaging/src/lib/queue-manager.ts`)

```typescript
import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobType, QueueConfig, RetryStrategy } from './job-types';

@Injectable()
export class QueueManager {
  private readonly logger = new Logger(QueueManager.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Create and configure a queue with standardized options
   */
  async createQueue(name: string, config?: Partial<QueueConfig>): Promise<Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const defaultConfig: QueueConfig = {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      delay: 0,
      stalledInterval: 30000,
      maxStalledCount: 1,
    };

    const queueConfig = { ...defaultConfig, ...config };
    
    const queueOptions: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: queueConfig.removeOnComplete,
        removeOnFail: queueConfig.removeOnFail,
        attempts: queueConfig.attempts,
        backoff: queueConfig.backoff,
        delay: queueConfig.delay,
      },
      settings: {
        stalledInterval: queueConfig.stalledInterval,
        maxStalledCount: queueConfig.maxStalledCount,
      },
    };

    const queue = new Queue(name, queueOptions);
    this.queues.set(name, queue);

    // Create DLQ for this queue
    await this.createDLQ(name);

    this.logger.log(`Queue '${name}' created with config: ${JSON.stringify(queueConfig)}`);
    return queue;
  }

  /**
   * Create Dead Letter Queue for failed jobs
   */
  private async createDLQ(queueName: string): Promise<Queue> {
    const dlqName = `${queueName}-dlq`;
    
    const dlqOptions: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 1000, // Keep more DLQ jobs for analysis
        removeOnFail: 1000,
        attempts: 1, // No retries in DLQ
      },
    };

    const dlq = new Queue(dlqName, dlqOptions);
    this.queues.set(dlqName, dlq);
    
    return dlq;
  }

  /**
   * Add job to queue with idempotency and tenant context
   */
  async addJob<T = any>(
    queueName: string,
    jobType: JobType,
    data: T,
    options: {
      tenantId?: string;
      userId?: string;
      correlationId?: string;
      priority?: number;
      delay?: number;
      idempotencyKey?: string;
    } = {}
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const jobId = `${jobType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = options.correlationId || jobId;

    const jobData = {
      ...data,
      metadata: {
        tenantId: options.tenantId,
        userId: options.userId,
        correlationId,
        jobType,
        createdAt: new Date().toISOString(),
        source: 'queue-manager',
      },
    };

    const jobOptions = {
      jobId,
      priority: options.priority || 5,
      delay: options.delay || 0,
      attempts: this.getRetryStrategy(queueName).attempts,
      backoff: this.getRetryStrategy(queueName).backoff,
    };

    // Check idempotency if key provided
    if (options.idempotencyKey) {
      const existing = await this.checkIdempotency(options.idempotencyKey);
      if (existing) {
        this.logger.debug(`Job skipped due to idempotency: ${options.idempotencyKey}`);
        return existing;
      }
    }

    const job = await queue.add(jobType, jobData, jobOptions);
    
    // Store idempotency mapping
    if (options.idempotencyKey) {
      await this.storeIdempotency(options.idempotencyKey, job.id!);
    }

    this.logger.log(`Job added to '${queueName}': ${job.id} (${jobType})`);
    return job.id!;
  }

  /**
   * Get retry strategy for specific queue
   */
  private getRetryStrategy(queueName: string): RetryStrategy {
    const strategies: Record<string, RetryStrategy> = {
      'ingress-events': {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
      'orchestration-flows': {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
      'integration-tasks': {
        attempts: 7,
        backoff: { type: 'exponential', delay: 10000 },
      },
      'notifications': {
        attempts: 5,
        backoff: { type: 'exponential', delay: 30000 },
      },
      'analytics-events': {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
      },
    };

    return strategies[queueName] || {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    };
  }

  /**
   * Check if job already processed (idempotency)
   */
  private async checkIdempotency(key: string): Promise<string | null> {
    const jobId = await this.redis.hget('idempotency', key);
    return jobId;
  }

  /**
   * Store idempotency mapping
   */
  private async storeIdempotency(key: string, jobId: string): Promise<void> {
    await this.redis.hsetex('idempotency', 86400, key, jobId); // 24-hour TTL
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async close(): Promise<void> {
    this.logger.log('Closing queue manager...');
    
    // Close all workers first
    for (const [name, worker] of this.workers) {
      this.logger.log(`Closing worker: ${name}`);
      await worker.close();
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      this.logger.log(`Closing queue: ${name}`);
      await queue.close();
    }

    // Close Redis connection
    this.redis.disconnect();
    
    this.logger.log('Queue manager closed');
  }
}
```

### 2. Base Worker (`libs/shared/messaging/src/lib/base-worker.ts`)

```typescript
import { Worker, Job, WorkerOptions } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { JobMetadata, WorkerMetrics } from './job-types';

export abstract class BaseWorker {
  protected readonly logger: Logger;
  protected worker: Worker | null = null;
  protected metrics: WorkerMetrics = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    averageProcessingTime: 0,
  };

  constructor(
    protected readonly queueName: string,
    protected readonly redis: Redis,
    protected readonly concurrency: number = 5
  ) {
    this.logger = new Logger(`${this.constructor.name}(${queueName})`);
  }

  /**
   * Abstract method that subclasses must implement
   */
  protected abstract processJob(job: Job): Promise<void>;

  /**
   * Initialize the worker
   */
  async initialize(): Promise<void> {
    const workerOptions: WorkerOptions = {
      connection: this.redis,
      concurrency: this.concurrency,
    };

    this.worker = new Worker(
      this.queueName,
      this.processJobWrapper.bind(this),
      workerOptions
    );

    // Set up event listeners
    this.worker.on('completed', this.onJobCompleted.bind(this));
    this.worker.on('failed', this.onJobFailed.bind(this));
    this.worker.on('stalled', this.onJobStalled.bind(this));

    this.logger.log(`Worker initialized for queue '${this.queueName}' with concurrency ${this.concurrency}`);
  }

  /**
   * Wrapper for job processing with error handling and metrics
   */
  private async processJobWrapper(job: Job): Promise<void> {
    const startTime = Date.now();
    const metadata: JobMetadata = job.data.metadata;
    const correlationId = metadata?.correlationId || job.id;

    // Set correlation context for logging
    this.logger.setContext({ 
      correlationId,
      tenantId: metadata?.tenantId,
      jobId: job.id,
    });

    try {
      this.logger.debug(`Processing job: ${job.id} (${metadata?.jobType})`);

      // Check tenant limits before processing
      if (metadata?.tenantId) {
        await this.checkTenantLimits(metadata.tenantId);
      }

      // Process the job with timeout
      await this.processWithTimeout(job);

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(true, processingTime);

      this.logger.debug(`Job completed: ${job.id} (${processingTime}ms)`);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(false, processingTime);

      this.logger.error(`Job failed: ${job.id}`, {
        error: error.message,
        stack: error.stack,
        processingTime,
      });

      // Move to DLQ if max attempts reached
      if (job.attemptsMade >= (job.opts.attempts || 5)) {
        await this.moveToDLQ(job, error);
      }

      throw error; // Let BullMQ handle retries
    }
  }

  /**
   * Process job with timeout protection
   */
  private async processWithTimeout(job: Job): Promise<void> {
    const timeout = this.getJobTimeout(job.data.metadata?.jobType);
    
    return Promise.race([
      this.processJob(job),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Job timeout after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  /**
   * Get timeout for specific job type
   */
  private getJobTimeout(jobType?: string): number {
    const timeouts: Record<string, number> = {
      'webhook-process': 30000,      // 30 seconds
      'flow-execute': 120000,        // 2 minutes
      'api-call': 60000,            // 1 minute
      'notification-send': 30000,    // 30 seconds
      'usage-collect': 300000,      // 5 minutes
    };

    return timeouts[jobType || 'default'] || 60000; // Default 1 minute
  }

  /**
   * Check tenant resource limits
   */
  private async checkTenantLimits(tenantId: string): Promise<void> {
    const key = `tenant:limits:${tenantId}`;
    const limits = await this.redis.hgetall(key);

    if (limits.maxConcurrentJobs) {
      const current = await this.redis.get(`tenant:current:${tenantId}`);
      if (current && parseInt(current) >= parseInt(limits.maxConcurrentJobs)) {
        throw new Error(`Tenant ${tenantId} exceeded concurrent job limit`);
      }
    }

    // Increment current job count
    await this.redis.incr(`tenant:current:${tenantId}`);
    await this.redis.expire(`tenant:current:${tenantId}`, 3600); // 1 hour expiry
  }

  /**
   * Move failed job to Dead Letter Queue
   */
  private async moveToDLQ(job: Job, error: Error): Promise<void> {
    const dlqName = `${this.queueName}-dlq`;
    
    // Add to DLQ with failure information
    await this.redis.lpush(`bull:${dlqName}:failed`, JSON.stringify({
      id: job.id,
      data: job.data,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      attempts: job.attemptsMade,
      originalQueue: this.queueName,
    }));

    this.logger.warn(`Job moved to DLQ: ${job.id} -> ${dlqName}`);
  }

  /**
   * Update worker metrics
   */
  private updateMetrics(success: boolean, processingTime: number): void {
    this.metrics.processed++;
    
    if (success) {
      this.metrics.succeeded++;
    } else {
      this.metrics.failed++;
    }

    // Update average processing time
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.processed - 1) + processingTime) 
      / this.metrics.processed;
  }

  /**
   * Event handlers
   */
  private async onJobCompleted(job: Job): Promise<void> {
    // Decrement tenant job count
    if (job.data.metadata?.tenantId) {
      await this.redis.decr(`tenant:current:${job.data.metadata.tenantId}`);
    }
  }

  private async onJobFailed(job: Job, error: Error): Promise<void> {
    // Decrement tenant job count
    if (job.data.metadata?.tenantId) {
      await this.redis.decr(`tenant:current:${job.data.metadata.tenantId}`);
    }

    this.logger.error(`Job failed in queue '${this.queueName}': ${job.id}`, {
      error: error.message,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    });
  }

  private async onJobStalled(job: Job): Promise<void> {
    this.logger.warn(`Job stalled in queue '${this.queueName}': ${job.id}`);
  }

  /**
   * Get worker metrics
   */
  getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    if (this.worker) {
      this.logger.log(`Closing worker for queue '${this.queueName}'`);
      await this.worker.close();
      this.worker = null;
    }
  }
}
```

### 3. Job Types and Interfaces (`libs/shared/messaging/src/lib/job-types.ts`)

```typescript
export type JobType = 
  | 'webhook-process'
  | 'flow-execute'
  | 'api-call'
  | 'notification-send'
  | 'usage-collect'
  | 'tenant-provision'
  | 'integration-sync';

export interface JobMetadata {
  tenantId?: string;
  userId?: string;
  correlationId: string;
  jobType: JobType;
  createdAt: string;
  source: string;
}

export interface QueueConfig {
  removeOnComplete: number;
  removeOnFail: number;
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  delay: number;
  stalledInterval: number;
  maxStalledCount: number;
}

export interface RetryStrategy {
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

export interface WorkerMetrics {
  processed: number;
  succeeded: number;
  failed: number;
  averageProcessingTime: number;
}

// Specific job data interfaces
export interface WebhookJobData {
  provider: string;
  eventType: string;
  payload: Record<string, any>;
  receivedAt: string;
  metadata: JobMetadata;
}

export interface FlowJobData {
  flowId: string;
  steps: FlowStep[];
  bindings: FlowBinding[];
  context: Record<string, any>;
  metadata: JobMetadata;
}

export interface FlowStep {
  id: string;
  type: string;
  adapter: string;
  config: Record<string, any>;
}

export interface FlowBinding {
  adapterId: string;
  config: Record<string, any>;
}

export interface ApiCallJobData {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  metadata: JobMetadata;
}

export interface NotificationJobData {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  content: string;
  template?: string;
  variables?: Record<string, any>;
  metadata: JobMetadata;
}

export interface UsageCollectionJobData {
  provider: string;
  dateRange: {
    from: string;
    to: string;
  };
  clientIds?: string[];
  metadata: JobMetadata;
}
```

### 4. Idempotency Manager (`libs/shared/messaging/src/lib/idempotency.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { createHash } from 'crypto';

@Injectable()
export class IdempotencyManager {
  constructor(private readonly redis: Redis) {}

  /**
   * Generate idempotency key from job data
   */
  generateKey(
    tenantId: string,
    jobType: string,
    data: Record<string, any>,
    timestampWindow: number = 300000 // 5 minutes
  ): string {
    // Create content hash from critical data fields
    const contentHash = this.hashContent(data);
    
    // Create timestamp window (rounds down to nearest window)
    const windowStart = Math.floor(Date.now() / timestampWindow) * timestampWindow;
    
    return `${tenantId}:${jobType}:${contentHash}:${windowStart}`;
  }

  /**
   * Check if operation already processed
   */
  async checkProcessed(key: string): Promise<string | null> {
    return await this.redis.hget('idempotency', key);
  }

  /**
   * Store operation result for deduplication
   */
  async storeResult(key: string, jobId: string, ttl: number = 86400): Promise<void> {
    await this.redis.hsetex('idempotency', ttl, key, jobId);
  }

  /**
   * Process with idempotency check
   */
  async processWithIdempotency<T>(
    key: string,
    processor: () => Promise<T>,
    ttl?: number
  ): Promise<{ result: T; wasProcessed: boolean }> {
    // Check if already processed
    const existingResult = await this.checkProcessed(key);
    if (existingResult) {
      return {
        result: JSON.parse(existingResult) as T,
        wasProcessed: true,
      };
    }

    // Process operation
    const result = await processor();
    
    // Store result
    await this.storeResult(key, JSON.stringify(result), ttl);
    
    return {
      result,
      wasProcessed: false,
    };
  }

  /**
   * Hash content for idempotency key generation
   */
  private hashContent(data: Record<string, any>): string {
    // Sort keys for consistent hashing
    const sortedData = this.sortObject(data);
    const content = JSON.stringify(sortedData);
    
    return createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16); // First 16 chars for brevity
  }

  /**
   * Recursively sort object keys for consistent hashing
   */
  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach(key => {
        sorted[key] = this.sortObject(obj[key]);
      });

    return sorted;
  }

  /**
   * Clean up expired idempotency records
   */
  async cleanup(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;

    const keys = await this.redis.hkeys('idempotency');
    
    for (const key of keys) {
      // Extract timestamp from key (assumes last segment is timestamp)
      const segments = key.split(':');
      const timestamp = parseInt(segments[segments.length - 1]);
      
      if (timestamp < cutoffTime) {
        await this.redis.hdel('idempotency', key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
```

## Worker Implementation Examples

### Webhook Ingress Worker (`libs/workers/ingress-worker/src/lib/ingress-worker.service.ts`)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseWorker } from '@max-ai/shared/messaging';
import { WebhookJobData } from '@max-ai/shared/messaging';
import { Redis } from 'ioredis';

@Injectable()
export class IngressWorkerService extends BaseWorker {
  constructor(redis: Redis) {
    super('ingress-events', redis, 10); // 10 concurrent workers
  }

  protected async processJob(job: Job<WebhookJobData>): Promise<void> {
    const { provider, eventType, payload, metadata } = job.data;

    this.logger.debug(`Processing ${provider} webhook: ${eventType}`, {
      correlationId: metadata.correlationId,
      tenantId: metadata.tenantId,
    });

    try {
      // Normalize webhook data
      const normalizedData = await this.normalizeWebhookData(provider, eventType, payload);

      // Validate against JSON Schema
      await this.validateWebhookData(provider, eventType, normalizedData);

      // Determine next action based on event type
      const nextActions = await this.determineNextActions(provider, eventType, normalizedData);

      // Queue follow-up jobs
      for (const action of nextActions) {
        await this.queueNextAction(action, normalizedData, metadata);
      }

      this.logger.log(`Webhook processed successfully: ${provider}/${eventType}`, {
        correlationId: metadata.correlationId,
        nextActions: nextActions.length,
      });

    } catch (error) {
      this.logger.error(`Webhook processing failed: ${provider}/${eventType}`, {
        error: error.message,
        correlationId: metadata.correlationId,
      });
      throw error;
    }
  }

  private async normalizeWebhookData(
    provider: string, 
    eventType: string, 
    payload: any
  ): Promise<Record<string, any>> {
    // Provider-specific normalization logic
    switch (provider) {
      case 'retell':
        return this.normalizeRetellWebhook(eventType, payload);
      case 'ghl':
        return this.normalizeGHLWebhook(eventType, payload);
      case 'twilio':
        return this.normalizeTwilioWebhook(eventType, payload);
      default:
        return payload; // Return as-is for unknown providers
    }
  }

  private normalizeRetellWebhook(eventType: string, payload: any): Record<string, any> {
    // Retell-specific normalization
    return {
      callId: payload.call_id,
      agentId: payload.agent_id,
      duration: payload.call_length_seconds,
      transcript: payload.transcript,
      startTime: payload.start_timestamp,
      endTime: payload.end_timestamp,
      originalPayload: payload,
    };
  }

  // Additional normalization methods...
}
```

### Orchestration Worker (`libs/workers/orchestration-worker/src/lib/orchestration-worker.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseWorker } from '@max-ai/shared/messaging';
import { FlowJobData } from '@max-ai/shared/messaging';
import { Redis } from 'ioredis';

@Injectable()
export class OrchestrationWorkerService extends BaseWorker {
  constructor(
    redis: Redis,
    private readonly adapterRegistry: AdapterRegistry,
    private readonly flowEngine: FlowEngine
  ) {
    super('orchestration-flows', redis, 5); // 5 concurrent workers
  }

  protected async processJob(job: Job<FlowJobData>): Promise<void> {
    const { flowId, steps, bindings, context, metadata } = job.data;

    this.logger.debug(`Executing flow: ${flowId}`, {
      correlationId: metadata.correlationId,
      tenantId: metadata.tenantId,
      stepCount: steps.length,
    });

    const execution = await this.flowEngine.createExecution(flowId, {
      correlationId: metadata.correlationId,
      tenantId: metadata.tenantId,
      context,
    });

    try {
      for (const step of steps) {
        await this.executeFlowStep(step, bindings, execution);
      }

      await this.flowEngine.completeExecution(execution.id, 'success');
      
      this.logger.log(`Flow executed successfully: ${flowId}`, {
        correlationId: metadata.correlationId,
        executionId: execution.id,
      });

    } catch (error) {
      await this.flowEngine.completeExecution(execution.id, 'failed', error.message);
      
      this.logger.error(`Flow execution failed: ${flowId}`, {
        error: error.message,
        correlationId: metadata.correlationId,
        executionId: execution.id,
      });
      throw error;
    }
  }

  private async executeFlowStep(
    step: FlowStep,
    bindings: FlowBinding[],
    execution: FlowExecution
  ): Promise<void> {
    // Find adapter binding for this step
    const binding = bindings.find(b => b.adapterId === step.adapter);
    if (!binding) {
      throw new Error(`No binding found for adapter: ${step.adapter}`);
    }

    // Get adapter instance
    const adapter = this.adapterRegistry.getAdapter(step.adapter);
    if (!adapter) {
      throw new Error(`Adapter not found: ${step.adapter}`);
    }

    // Execute step with adapter
    const stepResult = await adapter.execute(step.config, {
      ...binding.config,
      tenantId: execution.tenantId,
      correlationId: execution.correlationId,
    });

    // Update execution context with step result
    execution.context[`step_${step.id}_result`] = stepResult;
    
    await this.flowEngine.updateExecutionContext(execution.id, execution.context);
  }
}
```

## Configuration and Deployment

### Environment Configuration

**`.env` file**:
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Queue Configuration
QUEUE_DEFAULT_CONCURRENCY=5
QUEUE_MAX_MEMORY_MB=512
QUEUE_METRICS_ENABLED=true

# Monitoring
METRICS_EXPORT_INTERVAL=30
HEALTH_CHECK_INTERVAL=10

# Security
QUEUE_AUTH_ENABLED=true
QUEUE_TLS_ENABLED=false
```

### Docker Configuration

**`docker-compose.yml`**:
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  redis-commander:
    image: rediscommander/redis-commander:latest
    environment:
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  redis_data:
```

### Kubernetes Deployment

**Redis Cluster (`k8s/redis-cluster.yaml`)**:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis-cluster
  replicas: 3
  selector:
    matchLabels:
      app: redis-cluster
  template:
    metadata:
      labels:
        app: redis-cluster
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
          name: client
        - containerPort: 16379
          name: gossip
        command:
        - redis-server
        - /conf/redis.conf
        volumeMounts:
        - name: conf
          mountPath: /conf
        - name: data
          mountPath: /data
      volumes:
      - name: conf
        configMap:
          name: redis-cluster-config
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

## Monitoring and Observability

### Metrics Collection

**Queue Metrics Service (`apps/api-gateway/src/monitoring/queue-metrics.service.ts`)**:
```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueManager } from '@max-ai/shared/messaging';
import { PrometheusService } from './prometheus.service';

@Injectable()
export class QueueMetricsService {
  constructor(
    private readonly queueManager: QueueManager,
    private readonly prometheus: PrometheusService
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async collectQueueMetrics(): Promise<void> {
    const queues = ['ingress-events', 'orchestration-flows', 'integration-tasks', 'notifications', 'analytics-events'];

    for (const queueName of queues) {
      try {
        const stats = await this.queueManager.getQueueStats(queueName);
        
        // Export to Prometheus
        this.prometheus.setGauge('queue_jobs_waiting', stats.waiting, { queue: queueName });
        this.prometheus.setGauge('queue_jobs_active', stats.active, { queue: queueName });
        this.prometheus.setGauge('queue_jobs_completed', stats.completed, { queue: queueName });
        this.prometheus.setGauge('queue_jobs_failed', stats.failed, { queue: queueName });
        this.prometheus.setGauge('queue_jobs_delayed', stats.delayed, { queue: queueName });

      } catch (error) {
        this.logger.error(`Failed to collect metrics for queue: ${queueName}`, error);
      }
    }
  }
}
```

### Health Checks

**Queue Health Check (`apps/api-gateway/src/health/queue-health.indicator.ts`)**:
```typescript
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { QueueManager } from '@max-ai/shared/messaging';

@Injectable()
export class QueueHealthIndicator extends HealthIndicator {
  constructor(private readonly queueManager: QueueManager) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const queues = ['ingress-events', 'orchestration-flows', 'integration-tasks'];
    const healthData: Record<string, any> = {};

    try {
      for (const queueName of queues) {
        const stats = await this.queueManager.getQueueStats(queueName);
        
        // Check if queue is healthy (not too many failed jobs)
        const failureRate = stats.failed / (stats.completed + stats.failed || 1);
        const isHealthy = failureRate < 0.05; // Less than 5% failure rate
        
        healthData[queueName] = {
          status: isHealthy ? 'up' : 'down',
          stats,
          failureRate: Math.round(failureRate * 100) / 100,
        };
      }

      const overallHealthy = Object.values(healthData).every((queue: any) => queue.status === 'up');

      if (overallHealthy) {
        return this.getStatus(key, true, healthData);
      } else {
        throw new HealthCheckError('Queue system unhealthy', healthData);
      }

    } catch (error) {
      throw new HealthCheckError('Queue health check failed', { error: error.message });
    }
  }
}
```

## Testing Strategy

### Unit Tests

**Queue Manager Tests (`libs/shared/messaging/src/lib/queue-manager.spec.ts`)**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueueManager } from './queue-manager';
import { Redis } from 'ioredis';

jest.mock('ioredis');

describe('QueueManager', () => {
  let service: QueueManager;
  let mockRedis: jest.Mocked<Redis>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockRedis = new Redis() as jest.Mocked<Redis>;
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
          REDIS_DB: 0,
        };
        return config[key] || defaultValue;
      }),
    } as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueManager,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<QueueManager>(QueueManager);
  });

  describe('createQueue', () => {
    it('should create a queue with default configuration', async () => {
      const queueName = 'test-queue';
      const queue = await service.createQueue(queueName);
      
      expect(queue).toBeDefined();
      expect(queue.name).toBe(queueName);
    });

    it('should create a queue with custom configuration', async () => {
      const queueName = 'test-queue';
      const config = { attempts: 10, delay: 1000 };
      
      const queue = await service.createQueue(queueName, config);
      
      expect(queue).toBeDefined();
      expect(queue.name).toBe(queueName);
    });
  });

  describe('addJob', () => {
    beforeEach(async () => {
      await service.createQueue('test-queue');
    });

    it('should add a job with metadata', async () => {
      const jobData = { test: 'data' };
      const options = {
        tenantId: 'tenant-123',
        correlationId: 'corr-456',
      };

      const jobId = await service.addJob('test-queue', 'webhook-process', jobData, options);

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    it('should handle idempotency', async () => {
      const jobData = { test: 'data' };
      const options = {
        idempotencyKey: 'unique-key-123',
      };

      mockRedis.hget = jest.fn().mockResolvedValue(null);
      mockRedis.hsetex = jest.fn().mockResolvedValue('OK');

      const jobId1 = await service.addJob('test-queue', 'webhook-process', jobData, options);
      
      // Simulate second call with same idempotency key
      mockRedis.hget = jest.fn().mockResolvedValue(jobId1);
      const jobId2 = await service.addJob('test-queue', 'webhook-process', jobData, options);

      expect(jobId1).toBe(jobId2);
    });
  });
});
```

### Integration Tests

**Worker Integration Tests (`libs/workers/ingress-worker/src/lib/ingress-worker.integration.spec.ts`)**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { QueueManager } from '@max-ai/shared/messaging';
import { IngressWorkerService } from './ingress-worker.service';
import { Redis } from 'ioredis';

describe('IngressWorkerService Integration', () => {
  let service: IngressWorkerService;
  let queueManager: QueueManager;
  let redis: Redis;

  beforeAll(async () => {
    // Use test Redis instance
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 15, // Use separate test database
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngressWorkerService,
        QueueManager,
        { provide: Redis, useValue: redis },
        // ... other providers
      ],
    }).compile();

    service = module.get<IngressWorkerService>(IngressWorkerService);
    queueManager = module.get<QueueManager>(QueueManager);

    await service.initialize();
  });

  afterAll(async () => {
    await service.close();
    await redis.flushdb();
    redis.disconnect();
  });

  it('should process webhook job end-to-end', async () => {
    const webhookData = {
      provider: 'retell',
      eventType: 'call_completed',
      payload: {
        call_id: 'test-call-123',
        agent_id: 'agent-456',
        call_length_seconds: 120,
        transcript: 'Test conversation',
      },
      receivedAt: new Date().toISOString(),
    };

    const jobId = await queueManager.addJob(
      'ingress-events',
      'webhook-process',
      webhookData,
      {
        tenantId: 'tenant-test',
        correlationId: 'test-correlation-123',
      }
    );

    // Wait for job to be processed
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify job was completed
    const stats = await queueManager.getQueueStats('ingress-events');
    expect(stats.completed).toBeGreaterThan(0);
  });
});
```

## Performance Benchmarks

### Load Testing

**Load Test Script (`scripts/load-test-queues.js`)**:
```javascript
const { QueueManager } = require('@max-ai/shared/messaging');
const { performance } = require('perf_hooks');

async function loadTest() {
  const queueManager = new QueueManager();
  await queueManager.createQueue('load-test');

  const jobCount = 1000;
  const concurrency = 50;
  const batchSize = Math.ceil(jobCount / concurrency);

  console.log(`Starting load test: ${jobCount} jobs, ${concurrency} concurrent batches`);
  
  const startTime = performance.now();
  
  const promises = [];
  for (let batch = 0; batch < concurrency; batch++) {
    const promise = (async () => {
      for (let i = 0; i < batchSize; i++) {
        const jobIndex = batch * batchSize + i;
        if (jobIndex >= jobCount) break;

        await queueManager.addJob('load-test', 'webhook-process', {
          index: jobIndex,
          timestamp: Date.now(),
          data: 'x'.repeat(1000), // 1KB payload
        }, {
          tenantId: `tenant-${jobIndex % 10}`,
        });
      }
    })();
    promises.push(promise);
  }

  await Promise.all(promises);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  const throughput = (jobCount / duration) * 1000; // jobs per second

  console.log(`Load test completed:`);
  console.log(`- Jobs: ${jobCount}`);
  console.log(`- Duration: ${Math.round(duration)}ms`);
  console.log(`- Throughput: ${Math.round(throughput)} jobs/second`);

  await queueManager.close();
}

loadTest().catch(console.error);
```

## Migration and Upgrade Procedures

### Version Upgrade Script

**Upgrade Script (`scripts/upgrade-messaging.sh`)**:
```bash
#!/bin/bash

# Messaging backbone upgrade script
set -e

CURRENT_VERSION=$1
TARGET_VERSION=$2

if [ -z "$CURRENT_VERSION" ] || [ -z "$TARGET_VERSION" ]; then
  echo "Usage: $0 <current-version> <target-version>"
  exit 1
fi

echo "Upgrading messaging backbone from $CURRENT_VERSION to $TARGET_VERSION"

# Step 1: Pause job processing
echo "Pausing all queues..."
kubectl patch deployment api-gateway -p '{"spec":{"template":{"metadata":{"annotations":{"queue.pause":"true"}}}}}'
kubectl patch deployment webhook-ingress -p '{"spec":{"template":{"metadata":{"annotations":{"queue.pause":"true"}}}}}'

# Step 2: Wait for active jobs to complete
echo "Waiting for active jobs to complete..."
timeout 300 bash -c 'while [[ $(redis-cli --raw eval "return redis.call(\"get\", \"active-jobs-count\")" 0) != "0" ]]; do sleep 5; done'

# Step 3: Create backup of queue state
echo "Creating backup..."
redis-cli --rdb messaging-backup-$(date +%Y%m%d-%H%M%S).rdb

# Step 4: Apply configuration changes
echo "Applying configuration changes..."
kubectl apply -f k8s/messaging-${TARGET_VERSION}.yaml

# Step 5: Update application images
echo "Updating application images..."
kubectl set image deployment/api-gateway api-gateway=maxai/api-gateway:${TARGET_VERSION}
kubectl set image deployment/webhook-ingress webhook-ingress=maxai/webhook-ingress:${TARGET_VERSION}

# Step 6: Wait for deployments to be ready
echo "Waiting for deployments..."
kubectl rollout status deployment/api-gateway
kubectl rollout status deployment/webhook-ingress

# Step 7: Resume job processing
echo "Resuming job processing..."
kubectl patch deployment api-gateway -p '{"spec":{"template":{"metadata":{"annotations":{"queue.pause":null}}}}}'
kubectl patch deployment webhook-ingress -p '{"spec":{"template":{"metadata":{"annotations":{"queue.pause":null}}}}}'

# Step 8: Verify upgrade
echo "Verifying upgrade..."
timeout 60 bash -c 'while [[ $(kubectl get pods -l app=api-gateway -o jsonpath="{.items[*].status.phase}") != "Running" ]]; do sleep 5; done'

echo "Upgrade completed successfully!"
```

## Operational Runbooks

### Queue Monitoring Runbook

**Queue Health Monitor (`scripts/monitor-queues.js`)**:
```javascript
const { QueueManager } = require('@max-ai/shared/messaging');

class QueueMonitor {
  constructor() {
    this.queueManager = new QueueManager();
    this.alertThresholds = {
      maxWaiting: 1000,
      maxFailed: 100,
      maxFailureRate: 0.05,
    };
  }

  async monitor() {
    const queues = ['ingress-events', 'orchestration-flows', 'integration-tasks', 'notifications', 'analytics-events'];
    
    for (const queueName of queues) {
      await this.checkQueue(queueName);
    }
  }

  async checkQueue(queueName) {
    try {
      const stats = await this.queueManager.getQueueStats(queueName);
      
      // Check waiting jobs threshold
      if (stats.waiting > this.alertThresholds.maxWaiting) {
        this.sendAlert('high_queue_depth', {
          queue: queueName,
          waiting: stats.waiting,
          threshold: this.alertThresholds.maxWaiting,
        });
      }

      // Check failed jobs threshold
      if (stats.failed > this.alertThresholds.maxFailed) {
        this.sendAlert('high_failure_count', {
          queue: queueName,
          failed: stats.failed,
          threshold: this.alertThresholds.maxFailed,
        });
      }

      // Check failure rate
      const totalProcessed = stats.completed + stats.failed;
      if (totalProcessed > 0) {
        const failureRate = stats.failed / totalProcessed;
        if (failureRate > this.alertThresholds.maxFailureRate) {
          this.sendAlert('high_failure_rate', {
            queue: queueName,
            failureRate: Math.round(failureRate * 100) / 100,
            threshold: this.alertThresholds.maxFailureRate,
          });
        }
      }

      console.log(`✓ Queue ${queueName}: ${stats.waiting} waiting, ${stats.active} active, ${stats.failed} failed`);

    } catch (error) {
      this.sendAlert('queue_check_failed', {
        queue: queueName,
        error: error.message,
      });
    }
  }

  sendAlert(type, data) {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      data,
      severity: this.getAlertSeverity(type),
    };

    console.error(`🚨 ALERT: ${type}`, JSON.stringify(alert, null, 2));
    
    // Send to alerting system (Slack, PagerDuty, etc.)
    // this.alertManager.send(alert);
  }

  getAlertSeverity(type) {
    const severities = {
      'high_queue_depth': 'warning',
      'high_failure_count': 'error',
      'high_failure_rate': 'critical',
      'queue_check_failed': 'error',
    };
    
    return severities[type] || 'info';
  }
}

// Run monitor every 30 seconds
const monitor = new QueueMonitor();
setInterval(() => {
  monitor.monitor().catch(console.error);
}, 30000);

console.log('Queue monitor started...');
```

This comprehensive implementation guide provides all the necessary code, configurations, and operational procedures to implement the BullMQ messaging backbone successfully. The architecture is production-ready with proper error handling, monitoring, and scaling considerations.