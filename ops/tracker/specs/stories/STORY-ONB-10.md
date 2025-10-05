# STORY-ONB-10 — Initialize Client Resources (Supabase KB)

Summary
Initialize per-client resources for the selected SolutionPack, including Supabase project (guided/manual or API) and required tables (prompts, documents) as part of onboarding.

Inputs/Outputs
- Input: client_id, resource params
- Output: ResourceInitializationPlan executed; resource links stored

Ports/Adapters
- Resource provisioner (Supabase), token proxy in api-gateway

Error handling
- Manual steps supported; resume plan execution

Observability
- Audit resource creation; no secrets in logs

Test plan
- E2E: initialize resources for a test client and verify tables exist

Acceptance criteria
- Resources created; plan recorded; links stored in registry
