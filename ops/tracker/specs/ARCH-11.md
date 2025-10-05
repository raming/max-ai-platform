# ARCH-11 — Security/Compliance Baseline and Audit Implementation

Summary
Establish HIPAA-like and PCI-SAQ A posture early, define audit fields, redaction, and incident processes, and verify implementation across services.

Scope
- Adopt PCI SAQ A posture (hosted payments), webhook verification
- HIPAA-like controls where applicable; BAAs as needed
- Logger redaction; structured audit events across services

Outputs
- Security/compliance doc and ADR
- Audit log schema and examples in code
- Runbooks for incident and breach notification

Acceptance criteria
- S1: Redaction enabled; audit fields present in at least IAM, Ingress, Orchestrator, Payments
- S2: PCI posture documented; hosted payment UI only; webhook verification tests
- S3: Incident and breach process documented

References
- docs/design/security-compliance.md
- docs/adr/adr-0008-security-compliance.md
- docs/release/phase-1.md