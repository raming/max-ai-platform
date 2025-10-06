# DB Portability — Phase 1 Implementation Guide

Purpose
Provide step-by-step guidance to implement and validate database portability in Phase 1 with Prisma, repositories, and a CI matrix that exercises two providers (Vanilla Postgres, Supabase).

Checklist (DoR → DoD)
- Repositories defined for each aggregate; services depend on repositories only
- Prisma schema authored with ANSI-first types; migrations generated and reviewed
- Idempotent seeds implemented (ts-node) and separated from migrations
- Local dev validated with docker-compose Postgres
- CI jobs added: migrate, seed, smoke CRUD, contract tests for both providers
- Deviations documented in the design spec with fallbacks

Repository interfaces
- Repositories expose CRUD and query methods; no provider types leak to services
- Transactions exposed via UnitOfWork abstraction; avoid provider-specific APIs

Migrations & Seeds
- prisma migrate dev|deploy for local and CI
- Seed entrypoint: scripts/seed.ts; idempotent upserts using unique keys

Local validation (developer)
- docker compose up -d postgres
- npx prisma migrate dev
- ts-node scripts/seed.ts
- npm run test:integration

CI plan (document-only, executed by DevOps)
- job: db-vanilla-postgres
  steps: setup-postgres → migrate → seed → run smoke tests
- job: db-supabase
  steps: setup-supabase (ephemeral) → migrate → seed → run smoke tests
- Both run contract tests that assert SQL shapes and repository DTOs

Deviations log
- If a provider-specific extension is required:
  - add entry in the design spec Deviations section
  - include fallback and scope; link tests proving behavior

Security & Audit
- Enforce audit fields via repository/ORM middleware
- Redact secrets in logs; do not log SQL with sensitive parameters

Observability
- Add query timing metrics per repository method (labels: repo, method)
- Record migration run durations and failures

Handoffs
- Open PR with links to: ADR-0009 (Accepted), architecture spec, CI plan
- Tag: role:architect, phase:phase-1, seat:architect.morgan-lee
