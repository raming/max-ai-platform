import { IAuditService, AuditEvent } from '../../ports/audit.service.js';

export class ConsoleAuditService implements IAuditService {
  log(event: AuditEvent): void {
    // Ensure no secrets are logged; event should never include secrets
    const safe = { ...event };
    // In a real impl, redact known sensitive fields
    // eslint-disable-next-line no-console
    console.info('[AUDIT]', JSON.stringify(safe));
  }
}
