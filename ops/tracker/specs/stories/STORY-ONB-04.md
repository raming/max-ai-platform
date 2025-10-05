# STORY-ONB-04 — Wire Callbacks and Validate E2E Flow

Summary
Ensure Retell → n8n → GHL (and reverse) callbacks are configured to our ingress; validate the E2E onboarding flow on a test client.

Inputs/Outputs
- Input: client_id, providerLinks
- Output: verified callbacks; test run results

Ports/Adapters
- Ingress, Orchestrator, all provider adapters

Error handling
- Missing webhook → report and auto-fix if possible

Observability
- Correlation IDs end-to-end; structured logs

Test plan
- Trigger inbound/outbound sample calls/SMS; confirm fields updated and flows triggered

Acceptance criteria
- All callback URLs set to our ingress; E2E scenario passes