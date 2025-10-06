# CI Portability Workflow — Proposal (Docs Only)

Purpose
Define a non-destructive CI workflow to validate DB portability across two providers (Vanilla Postgres and Supabase) per ADR-0009 (Accepted) and the DB Portability Architecture Spec.

Scope (proposal)
- Trigger: pull_request and workflow_dispatch
- Matrix: provider=[postgres, supabase]
- Environment isolation: ephemeral containers per job (no external DB mutations)
- Steps:
  1) Setup Node and install deps
  2) Start provider service(s)
  3) Wait-for-DB readiness
  4) Prisma migrate deploy
  5) Seed (idempotent)
  6) Run smoke CRUD and contract tests
- Artifacts: upload test logs and coverage

Secrets
- Not required for the ephemeral containers (no external endpoints)
- If later using a hosted Supabase test project, inject a service role key via secrets and never print it. Use $SUPABASE_SERVICE_ROLE only as an env var (no echo).

Pass/Fail Gates
- Migrations must succeed on both providers
- Seeds must run idempotently on both providers
- Smoke CRUD + contract tests must pass
- Coverage remains ≥95%

How to enable (after approval)
- Move the example YAML from ops/docs/workflows/examples/ci-db-portability.yml to .github/workflows/ci-db-portability.yml (or merge its jobs into your primary CI file)
- Add any repository-specific test commands (npm scripts) if missing

References
- ops/docs/adr/adr-0009-db-portability.md
- ops/docs/design/db-portability-architecture-spec.md
- ops/docs/design/impl/phase-1/db-portability-implementation-guide.md
