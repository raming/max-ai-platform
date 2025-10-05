# ARCH-04 — IAM and Prompt Management

Summary
Define multi-tenant RBAC (IAM) and Prompt Management (templates → client instances → rollout) as first-class services with audit.

Scope
- IAM: actors, roles, scopes, policy checks; Google SSO; service tokens; audit events
- Prompt-svc: template registry, variables, versioning, publish workflow; contracts to adapters (Retell/n8n)
- Portal/API integration patterns

Outputs
- Schemas: IAM (User, Role, Assignment, PolicyCheck, Token), Prompt (Template, Instance, Version, Publish)
- ERDs: IAM and Prompt minimal tables
- ADRs and policies: RBAC approach; prompt rollout and audit policy

Acceptance criteria
- C1: Contracts and ERDs drafted
- C2: RBAC matrix for roles × resources (client, integration, agent, prompt)
- C3: Prompt rollout workflow defined with audit events
- C4: Lint/type/test gates documented for these services

References
- docs/adr/adr-0003-iam-and-prompt-services.md
- docs/design/architecture-overview.md
- docs/release/phase-1.md