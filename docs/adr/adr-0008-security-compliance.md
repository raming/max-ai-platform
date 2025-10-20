# ADR-0008: Security and Compliance Baseline

Status: Accepted
Date: 2025-10-06
Deciders: Architecture Team

## Context
We must consider HIPAA-like safeguards (if PHI enters the system), PCI constraints (payments), and audit logging from the beginning while preserving developer velocity.

## Decision
- PCI SAQ A: hosted payment UIs only; never store PAN; verify payment webhooks with timestamp skew checks
- RBAC enforced at the API gateway; services verify claims and tenant/client scopes; deny-by-default policy
- Structured audit logs across services; required events for IAM changes, token mint/revoke, webhook validation failures, admin actions; no secrets/PHI in logs; logger redaction enabled
- Encryption in transit and at rest; secrets management with key rotation; provider tokens only server-side via token proxy
- Incident/breach runbooks checked in and exercised as dry-runs each release

## Consequences
- Reduced compliance scope and risk; slight latency overhead from checks and redaction
- Improved auditability and incident readiness

## References
- ops/docs/design/security-compliance-baseline-spec.md
- ops/docs/design/impl/phase-1/iam.md
- ops/docs/design/impl/phase-1/webhook-ingress.md
- ops/docs/design/architecture-overview.md
