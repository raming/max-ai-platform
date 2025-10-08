const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../../ops/docs/contracts/iam/authz-request.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const validate = ajv.compile(schema);

const request = {
  subject: { id: 'user123', tenant: 'tenant1' },
  resource: { type: 'api', id: '/users' },
  action: 'read'
};

const valid = validate(request);
console.log('Valid:', valid);
if (!valid) console.log('Errors:', validate.errors);