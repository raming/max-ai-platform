import { ITenantValidator } from '../../ports/tenant-validator.js';

export class InMemoryTenantValidator implements ITenantValidator {
  async validate(tenantId: string, userId: string): Promise<void> {
    if (!tenantId || !userId) {
      throw new Error('Unauthorized');
    }
    // In real impl, call IAM policy engine
  }
}
