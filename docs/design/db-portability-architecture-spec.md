# Database Portability Architecture Specification

Purpose
Define a pragmatic strategy to keep persistence portable across PostgreSQL providers (e.g., Supabase, RDS, Cloud SQL, self-hosted) with minimal rework, while preserving developer velocity and compliance requirements.

Scope
- ORM and repository pattern selection and constraints
- SQL portability rules and deviations log
- Migrations, seeds, and fixtures policy
- CI matrix across providers (non-destructive) and local validation
- Security, RBAC, and policy layering (app-first)
- Observability, backups, and disaster recovery expectations

Non-functional requirements (NFRs)
- Portability: no provider lock-in features in Phase 1 without a documented fallback
- Reliability: migrations run idempotently; rollback path documented
- Security: RLS-equivalent via app-layer policy enforcement; no PII/secrets in logs
- Testability: migrations and basic CRUD verified against 2 providers in CI
- Performance: ANSI-first queries; provider-specific hints are optional and isolated

Decisions
1) ORM + repositories
- Choose Prisma as default ORM for developer productivity and type safety
- Enforce repository pattern in application services; no inline SQL in services
- Allow Knex for low-level adapters/tests where needed; keep in infra layer only

2) SQL and schema governance
- ANSI-first schema and queries
- Disallow provider-specific extensions in Phase 1 (e.g., pg_net, vector, row level security configs) unless logged in Deviations
- JSONB allowed with documented usage and indices

3) Migrations & seeds
- Prisma Migrate for canonical migrations
- Seeds implemented as idempotent scripts (ts-node), separated from migrations
- Naming: YYYYMMDDHHMMSS_<slug>

4) CI portability matrix (Phase 1)
- Providers: Postgres (vanilla) and Supabase
- CI jobs: lint, type, unit; migrate, seed, smoke tests (CRUD), contract tests
- Non-destructive: run on ephemeral containers; no external env modification

5) Security & RBAC
- App-layer authorization via IAM service and repository guards
- Provider-managed RLS is off by default in Phase 1; revisit in Phase 2 with policy generation
- Audit fields required: created_by, updated_by, correlation_id

6) Backup/restore & DR
- Backups must be provider-native (where available) with documented restore
- Logical dumps (pg_dump) acceptable for self-hosted; practice restores quarterly

Deviations and fallbacks (log)
- If a provider feature is used, document:
  - Feature and rationale
  - Fallback approach
  - Scope (tables, queries, adapters)
  - Test evidence across providers

Acceptance criteria mapping
- F1: Registry of rules and deviations exists in this spec (living section)
- F2: ADR-0009 updated to Accepted with rationale and provider test matrix
- F3: CI plan documented with jobs, envs, and secrets handling

Test strategy
- Unit: repository interfaces mocked
- Integration: migrations + repository CRUD against Postgres and Supabase
- Contract: DTOs/queries validated via JSON Schemas and SQL snapshots
- E2E (Phase 2): app workflows with portable data paths

References
- ops/docs/adr/adr-0009-db-portability.md
- ops/docs/design/architecture-overview.md
