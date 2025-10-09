import { AuditEvent } from '../auth/observability';
import { redactObject } from '../logger/logger';
import fs from 'fs';
import Ajv from 'ajv';

const ajv = new Ajv();

const auditEventSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { type: 'string' },
    timestamp: { type: 'string' },
    tenantId: { type: ['string', 'null'] },
    clientId: { type: ['string', 'null'] },
    userId: { type: ['string', 'null'] },
    resourceType: { type: ['string', 'null'] },
    resourceId: { type: ['string', 'null'] },
    action: { type: ['string', 'null'] },
    result: { type: 'string', enum: ['success', 'failure'] },
    error: { type: ['object', 'null'] },
    metadata: { type: ['object', 'null'] },
    correlationId: { type: ['string', 'null'] },
    ipAddress: { type: ['string', 'null'] },
    userAgent: { type: ['string', 'null'] }
  },
  required: ['id', 'type', 'timestamp', 'result']
};

const validate = ajv.compile(auditEventSchema);

export class AuditWriter {
  write(event: AuditEvent) {
    if (!validate(event)) {
      console.error('Invalid audit event', validate.errors);
      return;
    }
    const redacted = redactObject(event);
    fs.appendFileSync('/tmp/audit.log', JSON.stringify(redacted) + '\n');
  }
}