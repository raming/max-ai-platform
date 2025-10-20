# Project-Specific Overrides for Ops-Template

This file contains project-specific customizations for the ops-template system.

## Project Details
- **Project Slug**: ops-template
- **Tracker Prefix**: PROJ
- **Custom Rules**: Follow canonical documentation standards, sync changes to downstream projects
- **Downstream Projects**: hakim-platform-ops, airmeez-mirror, max-ai-ops, metazone-dev-squad-agent-ops

## Seat Mappings (from templates/agents.yaml)
- **Architect**: architect.morgan-lee (Morgan Lee, morgan-gh)
- **Team Lead**: team_lead.casey-brooks (Casey Brooks, casey-gh)
- **Dev**: dev.avery-kim (Avery Kim, avery-gh)
- **QA**: qa.mina-li (Mina Li, mina-gh)
- **Release Manager**: release_manager.rohan-patel (Rohan Patel, rohan-gh)
- **SRE**: sre.devon-singh (Devon Singh, devon-gh)

## Custom Commands
- /ops_agent: Load ops-agent mode for project management
- /sync_projects: Sync changes to all downstream projects
- /list_agents: List available agent seats and assignments

## Project-Specific Guardrails
- Always sync changes to downstream projects before declaring work complete
- Use session tracking for all work
- Follow dogfooding principle: apply all rules to own behavior
- Maintain consistency across all role prompts

## Integration Settings
- **GitHub Org**: hakim-platform-ops
- **Ops Repo Path**: /Users/rayg/repos/ops-template
- **Client Repo Path**: /absolute/path/to/client/repo (update as needed)
- **Sync Script**: ./scripts/sync-template.sh -w
- **Branch Naming**: kilo/work/ops_agent/{task-id}-{slug}

## Notes
- This file is read by the prompt to incorporate project-specific context.
- Update this file when project requirements or seat assignments change.
- Regenerate merged prompts after updating this file.