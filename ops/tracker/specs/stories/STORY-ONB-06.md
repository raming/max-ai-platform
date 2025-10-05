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

Developer checklist
- [ ] Step 1: Select SolutionPack (or Import from Providers / Derive from Client)
- [ ] Step 2: Customize variables (pack-level + artifact-level) and optional LLM refine
- [ ] Step 3: Create DeploymentPlan (targets + variables) and validate
- [ ] Step 4: Resources step to create/explain ResourceInitializationPlan (Supabase prompts/documents)
- [ ] Step 5: Deploy (upsert to providers) and record providerLinks
- [ ] Step 6: Validate callbacks (trigger test flows)
- [ ] Show provider links and audit activity in the UI
- [ ] Use schemas: ops/docs/contracts/solution-pack.schema.json, resource-initialization-plan.schema.json
- [ ] End-to-end tests across wizard steps (happy path and error paths)
