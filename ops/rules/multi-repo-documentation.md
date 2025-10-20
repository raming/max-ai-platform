# Documentation management for multi-repository projects (canonical)

Purpose
Provide a unified documentation architecture for contract projects with multiple repositories, enabling AI agents to access comprehensive knowledge while maintaining clean separation for selective syncing to client repositories.

## Documentation Structure

### Ops-Level Organization
```
airmeez-ops/docs/                    # Private ops documentation
├── architecture/                    # Unified architectural docs
│   ├── system-overview.md          # High-level system architecture
│   ├── data-flow.md                # Cross-system data flows
│   ├── integration-points.md       # Frontend ↔ Backend integration
│   └── deployment.md               # Multi-repo deployment strategy
├── frontend/                        # Frontend-specific documentation
│   ├── ui-components.md            # Component library & patterns
│   ├── user-experience.md          # UX guidelines & flows
│   ├── state-management.md         # Frontend state architecture
│   └── testing-strategy.md         # Frontend testing approach
├── backend/                         # Backend-specific documentation
│   ├── api-design.md               # API architecture & patterns
│   ├── database-schema.md          # Data models & relationships
│   ├── business-logic.md           # Domain logic & rules
│   └── performance.md              # Backend performance guidelines
├── shared/                          # Cross-cutting documentation
│   ├── coding-standards.md         # Project-wide coding standards
│   ├── security.md                 # Security requirements
│   └── testing.md                  # General testing guidelines
└── docs-index.yaml                 # Documentation metadata & sync rules
```

### Client Repository Structure
```
airmeez-frontend/ (client repo)
├── docs/                          # Frontend-relevant docs only
│   ├── architecture/
│   │   ├── system-overview.md     # Unified view
│   │   └── integration-points.md  # Integration details
│   ├── ui-components.md           # Frontend-specific
│   ├── user-experience.md         # Frontend-specific
│   └── shared/
│       ├── coding-standards.md    # Cross-cutting
│       └── security.md           # Cross-cutting

airmeez-backend/ (client repo)
├── docs/                          # Backend-relevant docs only
│   ├── architecture/
│   │   ├── system-overview.md     # Unified view
│   │   ├── data-flow.md          # Backend-relevant flows
│   │   └── integration-points.md # Integration details
│   ├── api-design.md             # Backend-specific
│   ├── database-schema.md        # Backend-specific
│   └── shared/
│       ├── coding-standards.md   # Cross-cutting
│       └── security.md           # Cross-cutting
```

## Documentation Metadata (docs-index.yaml)

### Index File Structure
```yaml
# Documentation index with sync metadata
version: "1.0"
project: "airmeez"

docs:
  # Unified Architecture Docs
  - path: "architecture/system-overview.md"
    title: "System Architecture Overview"
    targets: ["frontend", "backend"]  # Sync to both repos
    tags: ["architecture", "overview", "system"]
    last_updated: "2025-10-11"
    reviewers: ["architect.morgan-lee"]

  - path: "architecture/data-flow.md"
    title: "Data Flow Architecture"
    targets: ["backend"]  # Backend-focused
    tags: ["architecture", "data", "flow"]
    last_updated: "2025-10-11"

  - path: "architecture/integration-points.md"
    title: "Frontend-Backend Integration"
    targets: ["frontend", "backend"]  # Both need integration details
    tags: ["architecture", "integration", "api"]
    last_updated: "2025-10-11"

  # Frontend-Specific Docs
  - path: "frontend/ui-components.md"
    title: "UI Component Library"
    targets: ["frontend"]
    tags: ["frontend", "ui", "components"]
    last_updated: "2025-10-10"

  - path: "frontend/user-experience.md"
    title: "User Experience Guidelines"
    targets: ["frontend"]
    tags: ["frontend", "ux", "design"]
    last_updated: "2025-10-10"

  # Backend-Specific Docs
  - path: "backend/api-design.md"
    title: "API Design Patterns"
    targets: ["backend"]
    tags: ["backend", "api", "design"]
    last_updated: "2025-10-09"

  - path: "backend/database-schema.md"
    title: "Database Schema & Models"
    targets: ["backend"]
    tags: ["backend", "database", "schema"]
    last_updated: "2025-10-09"

  # Shared/Cross-Cutting Docs
  - path: "shared/coding-standards.md"
    title: "Coding Standards"
    targets: ["frontend", "backend"]
    tags: ["standards", "coding", "quality"]
    last_updated: "2025-10-08"

  - path: "shared/security.md"
    title: "Security Requirements"
    targets: ["frontend", "backend"]
    tags: ["security", "compliance"]
    last_updated: "2025-10-08"
```

## Selective Sync Process

### Sync Script Usage
```bash
# Sync docs for airmeez frontend repo
./scripts/sync-docs-to-repo.sh \
  --project "airmeez" \
  --target "frontend" \
  --source-docs "/path/to/airmeez-ops/docs" \
  --target-repo "/path/to/client/airmeez-frontend"

# Sync docs for airmeez backend repo
./scripts/sync-docs-to-repo.sh \
  --project "airmeez" \
  --target "backend" \
  --source-docs "/path/to/airmeez-ops/docs" \
  --target-repo "/path/to/client/airmeez-backend"
```

### Sync Logic
1. **Read Index**: Parse `docs-index.yaml` for project
2. **Filter by Target**: Select docs where `targets` includes the specified target
3. **Copy Files**: Copy matching docs to `target-repo/docs/`
4. **Preserve Structure**: Maintain directory structure from source
5. **Update Metadata**: Add sync timestamp and source info

## AI Agent Knowledge Base

### Unified Access
AI agents working in the ops repo have access to the complete documentation set:
- **Architecture docs** for system-level understanding
- **Frontend/backend docs** for component-specific knowledge
- **Shared docs** for cross-cutting concerns

### Context-Aware References
When AI agents create content for specific repositories, they can reference:
- Unified architecture docs for consistency
- Target-specific docs for implementation details
- Integration docs for cross-repo coordination

## Maintenance Workflow

### Documentation Updates
1. **Update Source**: Modify docs in ops repo
2. **Update Index**: Add/change metadata in `docs-index.yaml`
3. **Sync to Targets**: Run selective sync scripts
4. **Version Control**: Track documentation versions alongside code

### Quality Assurance
- **Index Validation**: Ensure all docs are properly indexed
- **Target Verification**: Confirm docs reach intended repositories
- **Freshness Checks**: Monitor documentation currency
- **Cross-References**: Validate links between related docs

## Client-Specific Customization

### Per-Client Configuration
Each client project can have its own documentation structure and sync rules:

```yaml
# Client-specific index file
version: "1.0"
project: "client-xyz"

repositories:
  web: "frontend"
  api: "backend"
  mobile: "mobile-app"

docs:
  - path: "architecture/overview.md"
    targets: ["web", "api", "mobile"]
    # ... client-specific metadata
```

This approach provides maximum flexibility for different client repository structures while maintaining a consistent documentation management framework.