# Database Portability and Abstraction

Purpose
Ensure the system remains database-agnostic so we can switch from Supabase to another provider or self-hosted Postgres/compatible DBs without major rewrites.

Approach
- ANSI-first SQL and portable ORM (e.g., Prisma/Knex) with provider-specific adapters if unavoidable
- Avoid vendor-specific features; when needed, document fallbacks
- Migrations: maintain forward-only migrations with a versioned changelog; test on multiple providers
- RLS/Policies: prefer application-layer authorization (IAM+policy checks) so we’re not locked to provider RLS dialects
- Connection & secrets: centralized config; rotate keys; TLS enforced

Data access patterns
- Repositories per domain; domain depends on ports, not concrete DB
- Contracts: input/output validated; no SQL inline in domain/services

Testing
- CI matrix to run integration tests against at least two Postgres distributions (e.g., Supabase Postgres and vanilla Postgres)

References
- docs/adr/adr-0009-db-portability.md
- docs/design/architecture-overview.md