import express from 'express';
import { buildProvidersRouter } from './controllers/providers.controller.js';
import { TokenProxyService } from '../services/token-proxy.service.js';
import { EnvSecretsService } from '../adapters/secrets/env-secrets.service.js';
import { ConsoleAuditService } from '../adapters/audit/console-audit.service.js';
import { InMemoryTenantValidator } from '../adapters/tenant/iam-tenant-validator.js';
import { StubSupabaseClient } from '../adapters/supabase/supabase.client.js';

export function createApp(deps?: { tokenProxy?: TokenProxyService }) {
  const app = express();
  app.use(express.json());

  // DI default wiring
  const tokenProxy =
    deps?.tokenProxy ||
    new TokenProxyService(
      new EnvSecretsService(),
      new ConsoleAuditService(),
      new StubSupabaseClient(),
      new InMemoryTenantValidator()
    );

  app.use('/api', buildProvidersRouter(tokenProxy));
  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  return app;
}
