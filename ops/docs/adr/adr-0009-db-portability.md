# ADR-0009: Database Portability

Status: Accepted
Date: 2025-10-06
Deciders: Architecture Team

## Context
We want the option to switch from Supabase to another managed or self-hosted PostgreSQL provider (RDS, Cloud SQL, self-hosted) without costly rewrites. Portability must not materially slow developer velocity.

## Decision

1) ORM and Repository Pattern
- Choose Prisma as the primary ORM for developer productivity and type-safety
- Enforce repository pattern in application services; no inline SQL in services
- Permit Knex for infra-level utilities/tests only (no service dependency)

2) ANSI-first SQL and Schema Governance
- Write ANSI-first queries and schema definitions
- Avoid provider-specific extensions in Phase 1 unless explicitly logged with fallbacks
- JSONB usage allowed with explicit indexing and access patterns documented

3) Migrations & Seeds
- Use Prisma Migrate as the canonical migration tool
- Idempotent seed scripts (ts-node) separate from migrations
- Migration naming: YYYYMMDDHHMMSS_<slug>

4) CI Portability Matrix (Phase 1)
- Providers: Vanilla Postgres and Supabase
- Jobs: migrate → seed → smoke (CRUD) → contract tests
- Run on ephemeral containers; non-destructive to shared envs

5) Security & RBAC
- App-layer authorization via IAM and repository guards; do not rely on provider RLS in Phase 1
- Audit fields required (created_by, updated_by, correlation_id)

6) Deviations & Fallbacks
- Any provider-specific feature must be recorded with fallback and scope in the design spec

## Consequences
- Slight overhead avoiding provider conveniences
- Lower migration cost and risk; consistent security model via IAM and application policies

## References
- ops/docs/design/db-portability-architecture-spec.md
- ops/docs/design/architecture-overview.md
