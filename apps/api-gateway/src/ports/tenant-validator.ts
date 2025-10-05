export interface ITenantValidator {
  validate(tenantId: string, userId: string): Promise<void>;
}
