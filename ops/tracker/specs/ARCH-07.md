# ARCH-07 — Platform-Agnostic CRM and Calendar Ports

Summary
Define ICRMPort and ICalendarPort with adapters for GHL/HubSpot/Dynamics and Google/Microsoft. Use OAuth proxy; encapsulate GHL usage.

Scope
- Ports: method signatures and canonical JSON Schemas
- OAuth proxy and token storage policies; tenant scoping; rotation
- GHL privacy approach and fallback strategies (polling) where webhooks are missing

Outputs
- Schemas: Contact, CustomFieldMapping, Availability, Booking
- Sequence diagrams for OAuth flows and booking pipelines
- Decision note on iFrame/whitelabel vs proxy (see ADR-0001)

Acceptance criteria
- C1: Ports and schemas drafted
- C2: OAuth proxy design and secrets policy documented
- C3: Decision note finalized; polling primitives specified

References
- docs/design/ports-and-adapters.md
- docs/adr/adr-0001-ghl-encapsulation.md
- docs/release/phase-1.md