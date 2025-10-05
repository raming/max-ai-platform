# STORY-ONB-07 — Prompt Refinement & Publishing UX

Summary
Provide a portal UX to review client-specific prompt instances, view diffs against base templates, refine (variables and optional LLM assist), and publish. Publishing activates the instance in prompt-svc and (optionally) pushes to providers when flagged.

Inputs/Outputs
- Input: client_id, instance_id, edits (variables/content), use_llm?: boolean
- Output: updated draft, diff preview, publish result (active=true) and audit record

Ports/Adapters
- prompt-svc (instances, diff, publish)
- ILlmPort (optional refine/copy helper)
- provider adapters (optional push on publish, behind a "also deploy" checkbox)

UI/UX
- List of prompt instances per client (status: draft/active)
- Detail page with:
  - Template vs Instance diff viewer (MD/structured)
  - Variables editor
  - Optional "Refine with AI" (ILlmPort) with preview + accept
  - Publish button (with optional "also deploy changes" to providers)
  - Activity/audit sidebar

Error handling
- Validation failures surfaced inline (schema errors)
- LLM failures: recover with manual edits; keep evaluation notes
- Publish conflict (already active newer version): prompt to confirm re-publish

Observability
- Correlation ID per edit session; audit events for edit and publish

Feature flags
- Gate the "Refine with AI" control behind a feature flag if needed

Test plan
- Unit: variables validation, diff rendering, publish API calls
- E2E: edit draft, AI refine path, publish, and verify instance status changes and audit logged

Acceptance criteria
- Users can edit a draft, see diffs, and publish to active
- Audit records present; optional provider push integrates with template deployment flow

Developer checklist
- [ ] Add portal route: /clients/:clientId/prompts
- [ ] Implement list + detail views with diff viewer
- [ ] Wire variables editor and schema validation (contracts/prompt-instance.schema.json)
- [ ] Add ILlmPort refine action (optional) with preview-accept flow
- [ ] Publish action calling prompt-svc; write audit entries; toggle optional deploy
- [ ] Unit and E2E tests; coverage ≥95%
