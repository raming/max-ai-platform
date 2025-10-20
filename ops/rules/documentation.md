# Documentation best practices (canonical)

Purpose
Keep agent-authored docs small, focused, and traceable. Avoid monoliths; cross-link instead of duplicating.

Principles
- One-file–one-topic: each doc addresses a single concern (e.g., IAM impl spec; ordering impl spec).
- Layering: roadmap/plan separate from component specs; ADRs for decisions.
- Anti-bloat: split docs that exceed ~3–5 pages or mix concerns. Add a local index if needed.
- Indexes: short README index files that point to focused docs.
- Traceability: every doc links to the tracker ID and relevant ADRs; consistent paths.
- Acceptance: include acceptance criteria sections; keep test strategy separate but linked.
- Canonical sources: reference JSON Schemas/ERDs instead of copying payloads.

Suggested structure
- tracker/specs/ — one spec per tracker task
- docs/adr/ — architecture decisions (one per decision)
- docs/design/ — architecture & design per domain/component
- docs/design/impl/phase-*/ — implementation specs per component, per phase
- docs/release/ — phase plans, handoffs, budgeting

Anti-patterns
- Mega-docs combining requirements, design, impl, and tests
- Unbounded lists of tasks in a single file (use tracker entries)

Enforcement
- **QA Validation**: QA agents must validate documentation compliance before Dev implementation begins
- **Escalation Path**: Non-compliant docs flagged to architect → Team Lead → human oversight
- **Quality Gates**: Documentation compliance required for issue progression to implementation
- **Multi-repo Sync**: QA oversees documentation synchronization to client repositories
