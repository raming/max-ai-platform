import { TokenProxyService } from '../src/services/token-proxy.service.js';
import { SupabaseOperation } from '../src/types/providers.js';
import { ISecretsService, SupabaseCredentials } from '../src/ports/secrets.service.js';
import { IAuditService, AuditEvent } from '../src/ports/audit.service.js';
import { ISupabaseClient } from '../src/ports/supabase.client.js';
import { ITenantValidator } from '../src/ports/tenant-validator.js';

class MockSecrets implements ISecretsService {
  called = 0;
  creds: SupabaseCredentials = { url: 'https://example.supabase.co', key: 'SERVICE_ROLE_FAKE' };
  async getSupabaseCredentials(): Promise<SupabaseCredentials> {
    this.called++;
    return this.creds;
  }
}

class MockAudit implements IAuditService {
  events: AuditEvent[] = [];
  log(event: AuditEvent): void {
    // Assert no secrets are present in the event
    if (JSON.stringify(event).includes('SERVICE_ROLE_FAKE')) {
      throw new Error('Secrets leaked to audit event');
    }
    this.events.push(event);
  }
}

class MockTenantValidator implements ITenantValidator {
  shouldThrow = false;
  last?: { tenantId: string; userId: string };
  async validate(tenantId: string, userId: string): Promise<void> {
    this.last = { tenantId, userId };
    if (this.shouldThrow) throw new Error('Unauthorized');
  }
}

class MockSupabaseClient implements ISupabaseClient {
  calls: { operation: SupabaseOperation; credentials: SupabaseCredentials }[] = [];
  async execute(operation: SupabaseOperation, credentials: SupabaseCredentials): Promise<any> {
    this.calls.push({ operation, credentials });
    // Return a deterministic response
    return { ok: true, op: operation.type };
  }
}

describe('TokenProxyService', () => {
  test('executes operation with tenant isolation, secrets, and audit (no secrets in logs)', async () => {
    const secrets = new MockSecrets();
    const audit = new MockAudit();
    const supabase = new MockSupabaseClient();
    const tenantValidator = new MockTenantValidator();

    const svc = new TokenProxyService(secrets, audit, supabase, tenantValidator);

    const operation: SupabaseOperation = { type: 'create_table', payload: { name: 'docs' } };
    const result = await svc.executeSupabaseOperation(operation, 'tenant-1', 'user-1', 'corr-123');

    expect(result).toEqual({ ok: true, op: 'create_table' });
    expect(tenantValidator.last).toEqual({ tenantId: 'tenant-1', userId: 'user-1' });
    expect(secrets.called).toBe(1);
    expect(audit.events.length).toBe(1);
    expect(audit.events[0]).toMatchObject({
      action: 'supabase.operation',
      tenantId: 'tenant-1',
      userId: 'user-1',
      correlationId: 'corr-123',
      operation: 'create_table',
    });
    // Ensure supabase client received credentials but audit did not
    expect(supabase.calls[0].credentials.key).toBe('SERVICE_ROLE_FAKE');
  });

  test('fails fast when tenant validation fails (no secret access, no audit)', async () => {
    const secrets = new MockSecrets();
    const audit = new MockAudit();
    const supabase = new MockSupabaseClient();
    const tenantValidator = new MockTenantValidator();
    tenantValidator.shouldThrow = true;

    const svc = new TokenProxyService(secrets, audit, supabase, tenantValidator);

    const operation: SupabaseOperation = { type: 'query', payload: { sql: 'select 1' } };

    await expect(
      svc.executeSupabaseOperation(operation, 'tenant-2', 'user-2', 'corr-456')
    ).rejects.toThrow('Unauthorized');

    expect(secrets.called).toBe(0);
    expect(audit.events.length).toBe(0);
    expect(supabase.calls.length).toBe(0);
  });
});
