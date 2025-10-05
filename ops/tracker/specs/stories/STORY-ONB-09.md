# STORY-ONB-09 — Derive SolutionPack from Existing Client

Summary
Derive a new SolutionPack from a production client setup (e.g., industry-specific pack like Plumbers) to reuse in future onboarding. Capture artifacts, variables, and wiring as a versioned pack.

Inputs/Outputs
- Input: source client_id
- Output: new SolutionPack with references to extracted artifacts and default variables

Ports/Adapters
- Registry, provider adapters (read-only scan)

Error handling
- Skip non-exportable items; log gaps

Observability
- Audit derivation with source references

Test plan
- Derive from a seeded client and create a new pack with expected contents

Acceptance criteria
- New SolutionPack created and validated; ready for customize→deploy flow
