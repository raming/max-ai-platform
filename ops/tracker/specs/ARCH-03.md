# ARCH-03 — Encapsulated Reviews/Calendar Onboarding (No GHL Domain Exposure)

Summary
Encapsulate Google reviews and calendar integration in our portal using server-side proxies and adapters, avoiding direct GHL UI/domain exposure.

Scope
- Confirm GHL API coverage for reviews/calendar; define proxy patterns
- OAuth proxy: Google/Microsoft tokens stored server-side per tenant/client
- Minimal guided flows if API gaps exist; whitelabel/iFrame only if officially supported and safe

Outputs
- Sequence diagrams: Connect Reviews, Connect Calendar
- Contracts: canonical Review and Calendar models
- Decision matrix: proxy vs embed

Acceptance criteria
- B1: Documented flows with endpoints and token storage policies
- B2: ADR finalized for embedding vs proxy (see ADR-0001)
- B3: Contracts for review objects and calendar events committed

References
- docs/adr/adr-0001-ghl-encapsulation.md
- docs/design/architecture-overview.md
- docs/release/phase-1.md