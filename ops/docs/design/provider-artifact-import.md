# Provider Artifact Import and Normalization

Purpose
Define what we read from each provider when importing artifacts and how we normalize into TemplateArtifacts + meta for SolutionPacks.

Kinds and properties

1) Retell (kind: retell)
- Identity
  - agent_id, agent_name, version, channel (voice), language
- Response engine / LLM
  - response_engine.type, llm_id/version, model
- Webhooks and tools
  - webhook_url(s); custom tools (URLs, parameter schemas)
- Voice config
  - voice_id, voice_model, temperature, speed, volume
- Call settings
  - max_call_duration_ms, interruption_sensitivity, dtmf options
- Post-call analysis
  - model, data_fields[] (name, type, choices)
- Numbers (optional)
  - phone_number(s)
- Notes
  - last_modification_timestamp, is_published

Normalized meta (retell)
- {
  "agentId", "agentName", "version", "webhooks": {"primary": "..."},
  "tools": [...],
  "voice": {"id", "model", "temperature", "speed", "volume"},
  "call": {"maxMs", "interruptSensitivity"},
  "postCall": {"model", "fields": [...]},
  "numbers": ["+1..."],
  "flags": {"published": false},
  "timestamps": {"modified": 1756218925503}
}

2) n8n (kind: n8n)
- Identity
  - workflow_id, name, version
- Nodes
  - nodes[] (type, parameters, credentials refs)
- Connections
  - edges (input/output indexes)
- Webhook nodes
  - path/HTTP methods; authentication config
- Credentials (references only)
  - names/ids referenced (no secrets)
- Settings
  - active (bool), timezone, settings JSON

Normalized meta (n8n)
- {
  "workflowId", "name", "version",
  "webhooks": [{"path": "/webhook/...", "methods": ["POST"]}],
  "credentials": ["retellApi", "ghlApi", "twilio"]
}

3) GHL (kind: ghl)
- Identity
  - workflow_id, name, folder/category, location_id
- Triggers and actions
  - trigger types (e.g., contact_created); actions (send_webhook, update_contact, send_sms)
- Webhook actions
  - URLs and payload templates
- Custom fields
  - reads[] and writes[] (field keys/ids)

Normalized meta (ghl)
- {
  "workflowId", "name", "category",
  "triggers": ["contact_created", ...],
  "actions": ["send_webhook", "update_contact"],
  "webhooks": [{"url": "https://.../webhook/..."}],
  "fields": {"reads": ["cf_..."], "writes": ["cf_..."]}
}

Normalization targets
- TemplateArtifact.contentRef: persisted source (JSON or MD) in DB or object storage
- TemplateArtifact.meta: provider-specific normalized meta (see meta schemas)
- SolutionPack.artifacts[].defaultVariables: any obvious variables we can pre-populate (webhook IDs, placeholders)

Validation
- Validate content shape by provider (best-effort) and meta against meta schemas
- Extract parameterization points:
  - Retell: webhook_url(s), phone_number(s), voice config variables
  - n8n: webhook node paths, credential names (to be bound at deploy), any literal URLs
  - GHL: webhook URLs, custom field IDs

Security
- Never import secrets or tokens; credentials are names/ids only
- PII redaction from meta/logs

References
- meta schemas: ../contracts/meta/*.schema.json
- Solution Pack: ../design/solution-packs.md
- Template Registry: ../design/template-registry-and-deployment.md
