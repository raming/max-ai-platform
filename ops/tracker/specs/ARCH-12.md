# ARCH-12 — Database Portability Strategy

Summary
Implement repository pattern, ANSI-first SQL with portable ORM, and CI testing to ensure we can move from Supabase to alternative Postgres providers or self-hosting.

Scope
- Choose ORM and repository layering
- Avoid vendor-specific features; document any necessary deviations
- CI matrix across at least two Postgres flavors

Outputs
- DB portability doc and ADR
- Repository skeletons and migration templates

Acceptance criteria
- D1: Repository pattern adopted in code templates
- D2: Migration pipeline runs against alternative Postgres target in CI
- D3: Any vendor-specific feature usage documented with fallback

References
- docs/design/db-portability.md
- docs/adr/adr-0009-db-portability.md
- docs/release/phase-1.md