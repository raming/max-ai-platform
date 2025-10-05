# MaxAI Platform

This repository contains both the application (`client/`) and operations (`ops/`) for the MaxAI platform in a unified structure.

## Quick Start

### Role-Based AI Agents

This project uses role-based AI agent prompts for different development workflows:

1. **Development Role**: 
   ```bash
   cd client
   ROLE=dev SEAT=dev.default PROJECT_OPS_DIR=$PWD/../ops ../ops/scripts/copy-role-prompt.sh
   ```

2. **SRE Role**:
   ```bash
   cd client
   ROLE=sre SEAT=sre.default PROJECT_OPS_DIR=$PWD/../ops ../ops/scripts/copy-role-prompt.sh
   ```

3. **Release Manager Role**:
   ```bash
   cd client
   ROLE=release_manager SEAT=release_manager.default PROJECT_OPS_DIR=$PWD/../ops ../ops/scripts/copy-role-prompt.sh
   ```

## Repository Structure

```
platform/
├── client/          # Application code
├── ops/             # Operations and infrastructure
│   ├── .agents/     # Agent configurations
│   ├── prompts/     # Role-based prompts
│   └── scripts/     # Utility scripts
└── README.md
```

## Development Workflow

The AI agent system allows you to work with role-specific contexts and capabilities. Each role has access to:

- Canonical operational knowledge
- Project-specific context
- Role-specific capabilities and constraints

This helps maintain consistent development practices while providing specialized assistance for different aspects of the project.