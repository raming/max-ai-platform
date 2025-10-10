# Scripts README

sync-all-projects.sh
- Purpose: Comprehensive synchronization of all ops-template content to registered projects.
- Usage:
  ./scripts/sync-all-projects.sh          # Dry run - see what would be synced
  ./scripts/sync-all-projects.sh -w       # Write mode - apply all changes
  ./scripts/sync-all-projects.sh -p hakim-platform-ops  # Sync specific project only
- What it does: Combines sync-template.sh + sync-github-prompts.sh + agent identity management
- Syncs: templates, scripts, rules, .github/prompts, agent configs, and generates role prompts

detect-stubs.js
- Purpose: Scan codebase for unimplemented prototype methods marked with standardized error messages.
- Usage:
  npm run detect-stubs                                    # Scan current directory
  node scripts/detect-stubs.js /path/to/code              # Scan specific directory
- CI Integration: Exits with code 1 if stub methods found, suitable for automated pipelines.
- Documentation: See scripts/README-stub-detection.md for detailed usage and examples.

merge-prompts.sh (legacy)
- Purpose: merges canonical rules (and optionally project-specific rules) into a single text.
- Usage:
- Canonical only: $HOME/repos/ops-template/scripts/merge-prompts.sh > /tmp/warp-merged-prompt.txt
- With project rules: PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/merge-prompts.sh > /tmp/warp-merged-prompt.txt

merge-role-prompt.sh (recommended)
- Purpose: builds a per-agent prompt (architect/team_lead/dev/sre) combining canonical role + common rules + project overlays.
- Usage examples:
  ROLE=architect PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/merge-role-prompt.sh > /tmp/warp-merged-architect.txt
  ROLE=team_lead  PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/merge-role-prompt.sh > /tmp/warp-merged-team-lead.txt
  ROLE=dev        PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/merge-role-prompt.sh > /tmp/warp-merged-dev.txt
  ROLE=sre        PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/merge-role-prompt.sh > /tmp/warp-merged-sre.txt
- Paste the output into Warp’s personal prompt section for the corresponding tab.

init-project-identities.sh
- Purpose: create a default .agents/rules/agents.yaml in a project with one seat per role (GitHub usernames as placeholders).
- Usage:
  PROJECT_OPS_DIR=$HOME/repos/<org>/<project>/ops $HOME/repos/ops-template/scripts/init-project-identities.sh

add-seat.sh
- Purpose: add/update a seat -> GitHub username mapping in a project.
- Usage:
  PROJECT_OPS_DIR=$HOME/repos/<org>/<project>/ops SEAT=dev.alex-chen GH_USER=alex-gh $HOME/repos/ops-template/scripts/add-seat.sh

generate-all-role-prompts.sh
- Purpose: generate merged prompts for all roles using seats from .agents/rules/agents.yaml (or default <role>.default).
- Usage:
  PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/generate-all-role-prompts.sh
- Outputs:
  /tmp/warp-merged-architect.txt, /tmp/warp-merged-team_lead.txt, /tmp/warp-merged-dev.txt, /tmp/warp-merged-qa.txt, /tmp/warp-merged-release_manager.txt, /tmp/warp-merged-sre.txt

list-prs.sh
- Purpose: list open PRs by priority and sprint labels for human triage.
- Usage:
  $HOME/repos/ops-template/scripts/list-prs.sh -R metazone-repo/hakim-platform -l priority:P0 -n 50
  $HOME/repos/ops-template/scripts/list-prs.sh -R metazone-repo/hakim-platform-ops -l sprint:sprint-2025-10-03

Agent identity
- Option 1: Pass SEAT and GH_USER explicitly:
  ROLE=dev SEAT=dev.alex-chen GH_USER=alex-gh $HOME/repos/ops-template/scripts/merge-role-prompt.sh > /tmp/warp-merged-dev.txt
- Option 2: Provide a mapping at $PROJECT_OPS_DIR/.agents/rules/agents.yaml and set SEAT only (requires yq):
  ROLE=dev SEAT=dev.alex-chen PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/merge-role-prompt.sh > /tmp/warp-merged-dev.txt
