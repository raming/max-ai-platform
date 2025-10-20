# Phase 4 Plan — Automation & Extensibility

Goals
- Make the platform self-serve and extensible; enable partners to build adapters and flows

Scope and links
- Architecture: ../design/architecture-overview.md
- Ports: ../design/ports-and-adapters.md
- ADR-0005: ../adr/adr-0005-declarative-flows.md

Milestones
1) Plugin/adapter SDK: codegen from contracts; example adapters
2) Marketplace concept: curated, versioned adapters and flow packs
3) Flow versioning: canary, rollback, A/B variants
4) Contract-testing harness for third-party adapters
5) Self-serve tenant onboarding; vertical solution templates

Acceptance criteria
- SDK builds and validates adapters against contracts
- Third-party adapter passes harness and deploys via marketplace flow
- Flow canary and rollback exercise documented

Risks and mitigations
- Supply-chain risk → signing, review policies, sandboxing
- Version drift → strict semver and contract versioning

Handoffs
- Product strategy for marketplace; Devs scaffold SDK examples