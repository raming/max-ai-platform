import express from 'express';
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

const app = express();
app.use(express.json({ type: ['application/json', 'application/*+json'] }));

// Load GHL event schema
const schemaPath = path.resolve(process.cwd(), '../../docs/contracts/ghl-event.schema.json');
let ghlSchema = null;
try {
  const raw = fs.readFileSync(schemaPath, 'utf-8');
  ghlSchema = JSON.parse(raw);
} catch (e) {
  console.warn('Could not load GHL schema at', schemaPath, e.message);
}

const ajv = new Ajv({ allErrors: true, strict: false });
let validateGhl = null;
if (ghlSchema) validateGhl = ajv.compile(ghlSchema);

app.get('/healthz', (_, res) => res.status(200).json({ ok: true }));

app.post('/webhook/ghl', (req, res) => {
  const payload = req.body;
  const ts = new Date().toISOString();
  console.log(`[${ts}] GHL webhook received:`, JSON.stringify(payload));

  if (validateGhl) {
    const valid = validateGhl(payload);
    if (!valid) {
      console.warn('Schema validation failed', validateGhl.errors);
      return res.status(400).json({ ok: false, errors: validateGhl.errors });
    }
  }
  return res.status(200).json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Webhook echo listening on :${port}`));
