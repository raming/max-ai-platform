# Branching by Role (Canonical)

Purpose
Establish clear branch naming, targets, and etiquette by role to keep history clean and reviews predictable.

Roles and default targets
- Developer (dev.*): work/dev/{TASK}-{slug} → PR to main
- Architect (arch.*): work/arch/{TASK}-{slug} → PR to main
- Team Lead (tl.*): work/tl/{TASK}-{slug} → PR to main
- QA (qa.*): work/qa/{TASK}-{slug} → PR to main (test docs/data/scripts)
- Release (release.*): work/release/{TAG-or-sprint} → PR to main

General rules
- Do not commit directly to main. Open a PR from your work/{role}/… branch.
- Prefer small, single-purpose PRs; stack if necessary and link dependencies.
- Use worktrees for parallelism: .agents/worktrees/{seat}/{short-branch-key}
- Link issues with “Fixes #N” and apply labels: role:{…}, type:{docs|spec|code|infra}, priority:{P0–P3}, sprint:{…}, area:{…}

Docs/spec/ADR etiquette (Architect, TL)
- Author in your role branch: work/arch/{TASK}-{slug} or work/tl/{TASK}-{slug}
- Target main by default so docs/specs land independently of feature timing
- If a doc is tightly coupled to an active feature PR, prefer: PR from work/arch/* → the feature branch, or provide suggested changes/comments on the feature PR
- Keep design artifacts under docs/, ADRs/ADR-####-*.md, and link from the PR body
- After merge, ensure summaries or excerpts are propagated to client-facing docs per project conventions

Branch naming examples
- dev: work/dev/MAX-1234-conv-service-api
- arch: work/arch/MAX-1234-conv-service-design
- tl: work/tl/MAX-1234-iteration-plan
- qa: work/qa/MAX-1234-test-plan

Merge strategy (by default)
- Squash merge into main with a clean summary; consider merge commits only for stacks where history adds value
- Required: review by a different seat; green CI; branch in sync with base

Seat ↔ branch guard (optional enforcement)
- Seat `dev.alex` → allowed branches: work/dev/* and agents/dev.alex
- Seat `arch.sara` → allowed branches: work/arch/* and agents/arch.sara
- Bypass in emergencies: GIT_GUARD_BYPASS=1

Notes
- For multi-seat collaboration on a single task, coordinate via a single PR branch and use issue/PR comments for handoff and state links
- Avoid rewriting shared history under review without coordination