# ADR-0003: IAM and Prompt Services Scope

Status: Proposed

Context
We need multi-tenant RBAC and managed prompt templates/instances with versioning and audit.

Decision
- apps/iam: Google SSO, service tokens, RBAC, policy checks, audit
- apps/prompt-svc: template registry, client instances, versioning, publish workflow, non-prod contract validation before activation

Consequences
- Clear separation of duties and audit trails
- Safer prompt changes and rollouts; governed by contracts

References
- docs/design/architecture-overview.md
- docs/design/ports-and-adapters.md