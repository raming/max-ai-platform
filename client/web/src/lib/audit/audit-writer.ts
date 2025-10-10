import { AuditEvent } from '../auth/observability';
import { redactObject } from '../logger/logger';
import fs from 'fs';

// TODO: Re-enable AJV validation after resolving Edge Runtime compatibility
// For now, skip validation to allow UI framework development
const validate = null;

export class AuditWriter {
  write(event: AuditEvent) {
    // Skip validation for now to resolve Edge Runtime build issues
    // if (validate && !validate(event)) {
    //   console.error('Invalid audit event', validate.errors);
    //   return;
    // }
    const redacted = redactObject(event);
    fs.appendFileSync('/tmp/audit.log', JSON.stringify(redacted) + '\n');
  }
}