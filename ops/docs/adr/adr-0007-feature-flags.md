# ADR-0007: Feature Flags and Progressive Delivery

Status: Proposed

Context
We need to release alpha/beta features (especially UI) safely. Prior art exists in hakim_platform where a global betaFeatures list controls exposure.

Decision
- Implement a global feature registry with statuses (alpha/beta/GA), environment-aware
- Server-side evaluation with allowlists for tenants/users; UI consumes evaluated flags
- If a feature is not present in global registry, treat as released (GA) for backward compatibility

Consequences
- Consistent gating across backend and UI; safe rollouts
- Requires governance to retire flags; add expiry dates and owners

References
- docs/design/feature-flags.md
- docs/design/architecture-overview.md