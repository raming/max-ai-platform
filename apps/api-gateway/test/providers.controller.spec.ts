import request from 'supertest';
import { createApp } from '../src/index.js';
import { TokenProxyService } from '../src/services/token-proxy.service.js';
import { ISecretsService, SupabaseCredentials } from '../src/ports/secrets.service.js';
import { IAuditService } from '../src/ports/audit.service.js';
import { ISupabaseClient } from '../src/ports/supabase.client.js';
import { ITenantValidator } from '../src/ports/tenant-validator.js';

class MockSecrets implements ISecretsService {
  async getSupabaseCredentials(): Promise<SupabaseCredentials> {
    return { url: 'https://example', key: 'SERVICE_ROLE_FAKE' };
  }
}

class MockAudit implements IAuditService {
  events: any[] = [];
  log(event: any): void {
    if (JSON.stringify(event).includes('SERVICE_ROLE_FAKE')) {
      throw new Error('secret leaked to logs');
    }
    this.events.push(event);
  }
}

class MockTenantValidator implements ITenantValidator {
  async validate(tenantId: string, userId: string): Promise<void> {
    if (!tenantId || !userId) throw new Error('Unauthorized');
  }
}

class MockSupabase implements ISupabaseClient {
  async execute(operation: any): Promise<any> {
    return { ok: true, op: operation.type };
  }
}

describe('ProvidersController', () => {
  const tokenProxy = new TokenProxyService(new MockSecrets(), new MockAudit(), new MockSupabase(), new MockTenantValidator());
  const app = createApp({ tokenProxy });

  it('rejects missing auth headers', async () => {
    const res = await request(app)
      .post('/api/providers/supabase/tables')
      .send({ name: 'docs', columns: [{ name: 'id', type: 'uuid' }] });
    expect(res.status).toBe(401);
  });

  it('validates request schema', async () => {
    const res = await request(app)
      .post('/api/providers/supabase/tables')
      .set('x-tenant-id', 't1')
      .set('x-user-id', 'u1')
      .send({ columns: [{ name: 'id', type: 'uuid' }] }); // missing name
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('creates table via token proxy', async () => {
    const res = await request(app)
      .post('/api/providers/supabase/tables')
      .set('x-tenant-id', 't1')
      .set('x-user-id', 'u1')
      .set('x-correlation-id', 'corr-abc')
      .send({ name: 'docs', columns: [{ name: 'id', type: 'uuid' }] });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.result).toEqual({ ok: true, op: 'create_table' });
  });
});
