# ADR-0008: Security and Compliance Baseline

Status: Proposed

Context
We must consider HIPAA-like safeguards (if PHI enters the system), PCI constraints (payments), and audit logging from the beginning. We also want strong privacy-by-default practices.

Decision
- Adopt PCI SAQ A posture by using hosted payment UIs; never store PAN; verify webhooks
- Implement HIPAA-like controls where applicable: least privilege, audit, breach process; ensure BAAs as needed
- Enforce structured audit logs across services; no secrets/PHI in logs; redaction in logger library
- Apply encryption at rest and in transit; secrets management and key rotation

Consequences
- Reduced compliance scope and lower risk
- Slight overhead to maintain audit pipelines and redaction rules

References
- docs/design/security-compliance.md
- docs/design/architecture-overview.md