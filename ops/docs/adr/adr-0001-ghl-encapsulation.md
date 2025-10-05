# ADR-0001: GHL Encapsulation Strategy

Status: Proposed

Context
Clients should not be exposed to GHL UI/domain. We need Google reviews and calendar integrations via our portal with server-side tokens and actions.

Decision
- Prefer server-side API proxy through our adapters for reviews and calendar flows
- Avoid iFrame/whitelabel unless officially supported and safe (auth, CSP, cookies)
- All tokens stored server-side per tenant/client; portal never exposes GHL URLs directly

Consequences
- Higher control, audit, and observability; slightly more backend effort
- If gaps exist in GHL APIs, fall back to minimal guided flows or document constraints

References
- docs/design/architecture-overview.md
- docs/design/ports-and-adapters.md