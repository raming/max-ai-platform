import { ISecretsService } from '../ports/secrets.service.js';
import { IAuditService } from '../ports/audit.service.js';
import { ISupabaseClient } from '../ports/supabase.client.js';
import { ITenantValidator } from '../ports/tenant-validator.js';
import { SupabaseOperation } from '../types/providers.js';

export class TokenProxyService {
  constructor(
    private readonly secrets: ISecretsService,
    private readonly audit: IAuditService,
    private readonly supabase: ISupabaseClient,
    private readonly tenantValidator: ITenantValidator
  ) {}

  private async validateTenantAccess(tenantId: string, userId: string): Promise<void> {
    await this.tenantValidator.validate(tenantId, userId);
  }

  async executeSupabaseOperation(
    operation: SupabaseOperation,
    tenantId: string,
    userId: string,
    correlationId: string
  ): Promise<any> {
    // 1) Enforce tenant isolation first
    await this.validateTenantAccess(tenantId, userId);

    // 2) Retrieve credentials securely (MUST NOT log)
    const credentials = await this.secrets.getSupabaseCredentials();

    // 3) Audit log without secrets
    this.audit.log({
      action: 'supabase.operation',
      tenantId,
      userId,
      correlationId,
      operation: operation.type,
    });

    // 4) Execute against provider using secure credentials
    return this.supabase.execute(operation, credentials);
  }
}
