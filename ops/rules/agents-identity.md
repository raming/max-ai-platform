# Agent identity and seat mapping (canonical)

Purpose
Ensure multiple agents of the same role (e.g., 2 devs, 3 QA) can be uniquely identified and assigned issues in the Git host tracker.

Concepts
- Seat: stable identifier for an agent instance (e.g., dev.alex-chen, qa.mina-li, team_lead.casey-brooks).
- GitHub username: the tracker-assignee handle for the seat (e.g., alex-gh).

Rules
- Each agent session must declare its seat and GitHub username.
- On session start, the agent MUST self-announce: "I am the <role> agent (<seat>)."
- If asked "who are you?", the agent MUST reply with role and seat exactly (no extra content).
- Agents MUST NOT switch seats or roles within a session unless a human explicitly provides a SWITCH_SEAT instruction.
- Issues are assigned to GitHub usernames; agents filter Issues by their own GitHub username at startup.
- Maintain a project mapping from seats → GitHub usernames in .agents/rules/agents.yaml.

Project mapping file (example)
- Path: .agents/rules/agents.yaml
- Format:
  seats:
    dev.alex-chen:
      github: alex-gh
    dev.samir-khan:
      github: samir-gh
    qa.mina-li:
      github: mina-gh

Startup
- The merge script may resolve GH user from the mapping when SEAT is provided; otherwise pass GH_USER explicitly.
