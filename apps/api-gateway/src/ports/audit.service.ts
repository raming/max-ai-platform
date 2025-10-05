export type AuditEvent = {
  action: string;
  tenantId: string;
  userId: string;
  correlationId: string;
  operation?: string;
  meta?: Record<string, unknown>;
};

export interface IAuditService {
  log(event: AuditEvent): void;
}
