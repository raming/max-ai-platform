# ADR-0009: Database Portability

Status: Proposed

Context
We want the option to switch from Supabase to another managed or self-hosted database without costly rewrites.

Decision
- Use ANSI-first SQL via a portable ORM (e.g., Prisma/Knex) with repository pattern
- Minimize provider-specific features; document any usage and provide fallbacks
- Prefer application-layer RBAC/policies over provider-specific RLS when feasible
- Maintain a CI matrix to test migrations and integrations across providers

Consequences
- Slight overhead to avoid vendor conveniences
- Lower migration cost and risk; consistent security model via IAM/policies

References
- docs/design/db-portability.md
- docs/design/architecture-overview.md