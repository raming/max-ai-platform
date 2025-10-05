# Security, Compliance, and Audit Baseline

Purpose
Define security and compliance requirements from the outset, focusing on HIPAA-like safeguards for PHI and PCI-SAQ A posture for payments, plus comprehensive audit logging.

Standards and scope
- HIPAA-like safeguards: administrative, technical, physical controls for any PHI-like data (if processed); apply minimum necessary principles
- PCI: target SAQ A by not storing/processing/transmitting raw card data; use hosted payment pages (Stripe Checkout/Elements, PayPal Checkout)
- General: encryption in transit (TLS 1.2+), encryption at rest, least privilege, RBAC, secrets management, key rotation

Audit logging
- Who: actor (user/seat/service), tenant_id, client_id
- What: action, resource, before/after hash or diff pointer
- When/Where: timestamp, request_id/correlation_id, source IP/UA where applicable
- Privacy: no PHI or secrets in logs; redaction enforced centrally
- Storage: write-once semantics where feasible; retention and purge policies documented

Data handling
- Data classification: public, internal, confidential, regulated (PHI/PCI-like)
- Pseudonymize or tokenize sensitive fields when possible
- Access paths: all data access behind RBAC + policy checks; service accounts scoped by tenant
- Backups: encrypted, periodic DR tests

Payments (PCI)
- Use payment provider hosted UIs; never touch PAN
- Webhooks verified; minimal customer metadata stored
- Keep within SAQ A boundary by avoiding cardholder environment in our systems

HIPAA-like controls (if applicable)
- BAAs with vendors as needed
- Access controls, session timeouts, MFA (for admin)
- Breach notification process documented

Operational controls
- SAST/DAST in CI/CD where feasible; dependency scanning
- Vulnerability management and patch cadence
- Incident response runbooks; on-call rotation

References
- docs/design/architecture-overview.md
- docs/adr/adr-0008-security-compliance.md