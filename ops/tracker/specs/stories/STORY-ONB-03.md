# STORY-ONB-03 — Deployment Plan and Deploy to Providers

Summary
Create DeploymentPlan for selected providers (Retell/n8n/GHL), execute deploy (upsert), and record provider links and logs. Wire callbacks to our ingress.

Inputs/Outputs
- Input: template_id, client_id, targets[], variables
- Output: DeploymentRecord with providerLinks[] and logs_ref

Ports/Adapters
- integrations-voice (Retell), integrations-workflow (n8n), integrations-crm (GHL)

Error handling
- Partial failures → mark record failed; keep logs; allow re-run
- Provider API errors → retries/backoff

Observability
- Correlation IDs across providers; audit deployment

Feature flags
- None

Test plan
- E2E: deploy all three provider artifacts for a test client; confirm external IDs/links; callbacks hit ingress

Acceptance criteria
- Plan created; deploy executed; providerLinks recorded; callbacks verified