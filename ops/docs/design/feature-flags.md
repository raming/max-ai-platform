# Feature Flags and Progressive Delivery

Purpose
Provide a global-to-tenant/user feature gating system to release alpha/beta features safely.

Model
- Global feature registry with statuses: alpha, beta, GA (released)
- Environment-aware (dev, staging, prod)
- Allowlist per tenant and per user for alpha/beta features
- If a feature is absent from the global registry → considered released (GA) (mirrors hakim_platform pattern)

Evaluation
- Server-side evaluation (api-gateway) for backend protections
- UI gates in portal-web; flags provided via secure config endpoint scoped to the authenticated user/tenant
- Cache with short TTL; audit accesses for sensitive toggles

Operations
- Flag lifecycle: define → trial (alpha) → broaden (beta) → GA → retire
- Rollouts: percentage/tags (optional in future), current scope = allowlist-first
- Ownership: architect/product approve new flags; expiry date to prevent flag rot

References
- docs/design/architecture-overview.md
- ADR-0007 — Feature flags approach
