# Branching and release policy (canonical)

Purpose
Define a simple,- **Merge authority**:
  - Code changes (client repo): Release Manager merges; Team Lead may merge low-risk docs/runtime configs with RM approval
  - Ops/specs/process (ops repo): Team Lead or Release Manager merges; Architect approval required for design/specs/ADR changes

**MULTI-REPOSITORY CONTRACT WORKFLOW (private mirror approach):**
For projects with separate client repositories using different git platforms:

- **Private Mirror Repositories**: Your GitHub repos mirroring client structure + ops
  - Each client repo has a private mirror with full ops integration
  - AI agents work here with complete internal tooling
  - Branches follow standard ops workflow

- **Client Repositories**: Clean repos on client's platform (GitBucket, etc.)
  - No ops content, only client code
  - Feature branches created via sync script
  - Manual PR creation for client review

- **Sync Workflow**:
  - Develop in private mirrors with full ops tooling
  - Use `sync-to-client-repo.sh` to transfer completed features
  - Create clean PRs in client repos for review
  - Client merges approved changes

- **Cross-Repository Coordination**:
  - Frontend/backend changes should reference ops specs
  - Use ops repo issues to track multi-repo features
  - Coordinate releases: ops changes first, then frontend/backend
  - Tag releases across repos for consistency

- **Delivery Process**:
  1. Complete work on contract branches across all repos
  2. Test integration between frontend/backend changes
  3. Create coordinated PRs from all contract branches to respective mains
  4. Client reviews and merges all related PRs together

Pull requestsictable git process that works well with agents and humans, enforces quality, and keeps main stable.

Branches
- Default base: main (protected)
- Working branches: work/{role}/{task-id}-{slug}
- Branch sync discipline:
  - At session start and before creating a PR, fetch latest and rebase (preferred) or fast-forward merge your work branch onto origin/main.
  - Commands: git fetch origin && git rebase origin/main  # or: git merge --ff-only origin/main

Branch base decision checklist (Dev)
- DEFAULT: Branch from origin/main
- Stack on previous QA-pending branch ONLY if ALL are true:
  - The new task strictly depends on unmerged code from the previous branch (shared contracts, data shape, boundaries) that cannot be feasibly isolated or guarded behind flags
  - Cherry-picking or re-implementing would be riskier than stacking
  - The prior PR is not severely blocked and is expected to merge in normal order
- Otherwise: branch from origin/main and either cherry-pick the minimal needed commits or use feature flags for isolation

Stacked branch hygiene
- Rebase the base (QA) branch onto origin/main daily, then rebase the stacked branch onto the updated base
- In the stacked PR body, declare the dependency (e.g., "Depends on #<base-pr>") and add labels: stacked, seat:<seat>, priority:<Pn>
- If the base PR becomes long-delayed or requires deep rework, pivot to main + cherry-pick or feature flags
  - Examples: work/dev/PROJ-0001-order-mvp, work/architect/PROJ-0001-iam-matrix
- Optional prefixes (when appropriate):
  - hotfix/{version-or-slug}
  - release/{version}
  - docs/{slug}, ops/{slug} (use sparingly; prefer work/{role}/...)
  - **contract/{client-slug}** (for contract work branches in client repositories)

**CONTRACT WORK BRANCHING STRATEGY (private mirror approach):**
For contract/consulting engagements using private mirror repositories:

- **Private Mirror Repo**: Your GitHub repo with full ops integration
  - Branches: `work/{role}/{task-id}-{slug}` (AI agent development branches)
  - Base: `main` (mirrors client master)
  - Internal: Full ops tooling, custom labels, seat references

- **Client Repo**: Clean delivery repo (GitBucket, etc.)
  - Branches: `feature/{task-id}-{slug}` (clean delivery branches)
  - Base: `master` (client's main branch)
  - Clean: No internal tooling or references

- **Sync Process**: Use `sync-to-client-repo.sh` to transfer completed work
  - Direction: Private work branches → Client feature branches
  - Content: Code changes only (excludes ops/, .agents/, .github/)
  - History: Clean commit messages, no internal references

- **Client Delivery PRs**: From `contract/{your-org}-{project}` → client's `main`
  - Frequency: Weekly/bi-weekly or milestone-based lump-sum deliveries
  - Content: Batch all approved contract work for client review
  - Review: Client team reviews the comprehensive changes
  - Merge: Client merges when satisfied

- **Agent Feature Branches**: `work/{role}/{task-id}-{slug}` branched from contract branch
  - Same workflow as ops repo, but based on contract branch instead of main
  - PRs: Merge feature branches back to contract branch (internal contract team review)
  - No direct client repo PRs until delivery time

- **Sync Discipline**:
  ```bash
  # Regular sync: merge client updates into contract branch
  git checkout contract/metazone-airmeez
  git fetch upstream  # client's main
  git merge upstream/main --no-ff -m "sync: merge client updates"
  
  # Before delivery: ensure contract branch is up-to-date
  git rebase upstream/main  # or merge if conflicts
  ```

Protection and merge authority
- main is protected:
  - No direct pushes (require PRs with reviews)
  - Linear history enforced (no merge commits)
  - Allow only squash or rebase merges; delete branch on merge
  - Require CI green (lint/type/tests/coverage/contracts) and required reviews
- Merge authority:
  - Code changes (client repo): Release Manager merges; Team Lead may merge low-risk docs/runtime configs with RM approval
  - Ops/specs/process (ops repo): Team Lead or Release Manager merges; Architect approval required for design/specs/ADR changes

Pull requests
- One PR per focused change; small and linked to an issue
- Title: <PROJECT>-<N> — <short outcome>
- Body must include:
  - Links: spec/ADRs/design docs
  - Acceptance criteria
  - Test evidence (coverage/screenshots/logs) when relevant
- Labels:
  - role:{team_lead|dev|qa|architect|release_manager}
  - phase:{phase-1|phase-2|phase-3}
  - area:{iam|ordering|lab|inventory|reporting|observability|security|data|migration|process|ops-template|dev}
  - seat:<seat> for assignment routing
- Cross-links:
  - Client PRs: include “Fixes #<N>”
  - Ops PRs: include “Refs org/hakim-platform-ops#<N>”

Quality gates (all PRs)
- CI: lint, type-check, unit+integration, contract tests, e2e smoke where applicable
- Lint: ESLint warnings are treated as errors (--max-warnings 0); PRs may not introduce new warnings
- Coverage ≥ 95% (global and changed packages) for code PRs
- Contract validation for adapter changes
- Security checks (dep scan, basic SAST), DCO/sign-off where used

Release process (code repo)
- Release candidate: cut release/{version} branch when a set of PRs is approved for release
- RM validates: CI green, checks passed, required approvals in place
- Tag: vX.Y.Z on main after merge, generate changelog/release notes
- Rollout: follow environment promotion (dev→test→prod); post-release checks; incident tracking

Hotfixes
- Branch: hotfix/{version-or-slug} from latest main
- Patch only the minimal change; PR to main (and backport if needed)

Ops repo guidance
- Planning/specs/process are tracked in ops; use PRs for significant changes (specs, ADRs, rules). Trivial copyedits allowed by Architect or TL if agreed.
- Use publish summaries for cross-posting into client PRs as needed.

Agent notes
- Agents must not push to main; always use work/... branches and open PRs.
- Branch naming: work/{role}/{task-id}-{slug}; keep PRs small and focused.
- Only squash-merge or rebase-merge; never use merge commits.
- Seat-based labels route review or action; humans respond via human:<name> labels or @mentions.
