# STORY-ONB-06 — Client Onboarding Wizard (Customize→Deploy)

Summary
Build a multi-step onboarding wizard: Client info → Select base templates → Customize (variables + optional LLM) → Plan/Deploy → Validate callbacks.

Inputs/Outputs
- Input: client details, template choices, variables, deploy targets
- Output: customized artifacts, deployment plan, deployment record, verified callbacks

Ports/Adapters
- Prompt-svc, Template Registry, ILlmPort, provider adapters, Ingress

Error handling
- Validation errors surfaced stepwise; partial deploy rollback guidance

Observability
- Correlation across steps; audit significant actions

Test plan
- E2E: onboarding a test client from templates to deploy; see provider links

Acceptance criteria
- Wizard completes end-to-end with at least one Retell + n8n + GHL deploy