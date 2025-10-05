import express from 'express';
import { DatabaseManager } from './config/database';
import { SqliteFeatureFlagStore } from './adapters/sqlite-feature-flag-store';
import { SqliteAuditLogger } from './adapters/sqlite-audit-logger';
import { FeatureFlagEvaluatorService } from './domain/feature-flag-evaluator';
import { createFeatureFlagRoutes } from './api/feature-flag-routes';
import { Environment, FeatureFlagStatus } from './domain/feature-flag';
import { generateUuid } from './utils/uuid';

/**
 * Application configuration
 */
interface AppConfig {
  port: number;
  databaseFile: string;
  environment: Environment;
}

/**
 * Main application class
 */
class FeatureFlagsApp {
  private app: express.Application;
  private db: DatabaseManager;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.app = express();
    this.db = new DatabaseManager({
      filename: config.databaseFile,
      verbose: process.env.NODE_ENV === 'development'
    });
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    // Initialize database
    await this.db.initialize();

    // Set up middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Add correlation ID middleware
    this.app.use((req, res, next) => {
      req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || generateUuid();
      res.setHeader('x-correlation-id', req.headers['x-correlation-id']);
      next();
    });

    // Create adapters and services
    const flagStore = new SqliteFeatureFlagStore(this.db);
    const auditLogger = new SqliteAuditLogger(this.db);
    const evaluator = new FeatureFlagEvaluatorService(flagStore, auditLogger);

    // Set up routes
    this.app.use('/api/flags', createFeatureFlagRoutes(evaluator));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        version: '1.0.0'
      });
    });

    // Bootstrap flags if needed
    await this.bootstrapFlags(flagStore);
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Feature Flags API server running on port ${this.config.port}`);
        // eslint-disable-next-line no-console
        console.log(`Environment: ${this.config.environment}`);
        // eslint-disable-next-line no-console
        console.log(`Database: ${this.config.databaseFile}`);
        resolve();
      });
    });
  }

  /**
   * Get the Express application instance (for testing)
   */
  getExpressApp(): express.Application {
    return this.app;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('Shutting down gracefully...');
    await this.db.close();
    process.exit(0);
  }

  /**
   * Bootstrap initial feature flags
   */
  private async bootstrapFlags(flagStore: SqliteFeatureFlagStore): Promise<void> {
    const bootstrapFlags = [
      {
        name: 'feature-flags-framework',
        description: 'Self-gating for the feature flags framework rollout',
        status: FeatureFlagStatus.ALPHA,
        environment: this.config.environment,
        owner: 'architecture'
      },
      {
        name: 'resource-init-token-proxy',
        description: 'Gate for token proxy functionality in resource initialization',
        status: FeatureFlagStatus.ALPHA,
        environment: this.config.environment,
        owner: 'development'
      },
      {
        name: 'template-resource-init',
        description: 'Gate for template resource initialization endpoint',
        status: FeatureFlagStatus.ALPHA,
        environment: this.config.environment,
        owner: 'development'
      }
    ];

    for (const flagData of bootstrapFlags) {
      try {
        const existing = await flagStore.getFlagByName(flagData.name, flagData.environment);
        if (!existing) {
          await flagStore.createFlag(flagData);
          // eslint-disable-next-line no-console
          console.log(`Bootstrap flag created: ${flagData.name}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to create bootstrap flag ${flagData.name}:`, (error as Error).message);
      }
    }
  }
}

/**
 * Application entry point
 */
async function main(): Promise<void> {
  // Configuration from environment
  const config: AppConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    databaseFile: process.env.DATABASE_FILE || './feature-flags.db',
    environment: (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT
  };

  const app = new FeatureFlagsApp(config);

  // Handle graceful shutdown
  process.on('SIGTERM', () => app.shutdown());
  process.on('SIGINT', () => app.shutdown());

  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Application startup failed:', error);
    process.exit(1);
  });
}

export { FeatureFlagsApp, AppConfig };