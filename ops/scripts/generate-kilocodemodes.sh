#!/usr/bin/env bash
set -euo pipefail

# generate-kilocodemodes.sh
# Generate .kilocodemodes file dynamically from merged prompts
# Usage: ./scripts/generate-kilocodemodes.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔄 Generating .kilocodemodes from merged prompts..."
echo ""

KILO_PROMPTS_DIR="$ROOT_DIR/kilo/prompts/merged"
KILO_MODES_DIR="$ROOT_DIR/kilo/modes"
OUTPUT_FILE="$ROOT_DIR/.kilocodemodes"

# Check if merged prompts exist
if [[ ! -d "$KILO_PROMPTS_DIR" ]]; then
  echo "❌ Merged prompts not found. Run ./scripts/sync-kilo-prompts.sh first"
  exit 1
fi

# Function to generate mode entry
generate_mode_entry() {
  local prompt_file="$1"
  local mode_slug="$2"
  local mode_name="$3"
  local mode_description="$4"
  local when_to_use="$5"

  if [[ ! -f "$prompt_file" ]]; then
    echo "⚠️  Prompt file not found: $prompt_file"
    return
  fi

  echo "📄 Processing: $prompt_file"

  # Extract the prompt content (remove YAML frontmatter if present)
  prompt_content=$(sed -n '/^---$/,/^---$/d; /^$/d; p' "$prompt_file" | sed 's/^/      /')

  # Get the actual seat name from agents.yaml based on role
  local seat_name="default"
  case "$mode_slug" in
    "architect")
      seat_name="morgan-lee"
      ;;
    "team-lead")
      seat_name="casey-brooks"
      ;;
    "dev")
      seat_name="avery-kim"
      ;;
    "qa")
      seat_name="mina-li"
      ;;
    "release-manager")
      seat_name="rohan-patel"
      ;;
    "sre")
      seat_name="devon-singh"
      ;;
    "ops-agent")
      seat_name="ops-template-support"
      ;;
  esac

  cat >> "$OUTPUT_FILE" << EOF
  - slug: $mode_slug
    name: $mode_name
    description: $mode_description
    whenToUse: $when_to_use
    roleDefinition: |-
      CRITICAL INSTRUCTION: When this prompt loads, you MUST display the banner below as your FIRST action.
      DO NOT list issues. DO NOT announce your role first. SHOW THE BANNER IMMEDIATELY.

      **🚨 MANDATORY FIRST ACTION 🚨**

      Upon loading via /${mode_slug} command, your VERY FIRST response must be this exact banner:

      \`\`\`
      ╔════════════════════════════════════════════════════════╗
      ║ 🤖 ${mode_name} Agent | Seat: ${mode_slug}.${seat_name}                     ║
      ╚════════════════════════════════════════════════════════╝

      Quick Commands:
        "save session"     - Save conversation to session file
        "resume session"   - Load yesterday's session
        "show status"      - Show current session info
        "who am i"         - Display role and seat

      Session Status:
        📁 Current: {session-file-name} or [None - say "save session" to create]
        📅 Date: {current-date}

      Ready to work! 🚀
      \`\`\`

      After showing the banner above, announce: "I am the ${mode_slug} agent (${mode_slug}.${seat_name})."

      **DO NOT start with issue lists or other content. BANNER FIRST. ALWAYS.**

      ---

$prompt_content
    groups:
      - read
      - edit
      - browser
      - command
      - mcp
    source: project
EOF
}

# Start generating the .kilocodemodes file
cat > "$OUTPUT_FILE" << 'EOF'
customModes:
EOF

# Generate entries for each merged prompt
if [[ -f "$KILO_PROMPTS_DIR/OpsAgent.kilo.md" ]]; then
  generate_mode_entry "$KILO_PROMPTS_DIR/OpsAgent.kilo.md" "ops-agent" "Ops Agent" "Multi-agent workflow management and project synchronization" "Use for ops-template development, rule creation, cross-project infrastructure work, or building/maintaining the agent system itself"
fi

if [[ -f "$KILO_PROMPTS_DIR/Architect.kilo.md" ]]; then
  generate_mode_entry "$KILO_PROMPTS_DIR/Architect.kilo.md" "architect" "Architect" "Design and Architect" "Use when you need to design system architecture, create technical specifications, or make architectural decisions"
fi

if [[ -f "$KILO_PROMPTS_DIR/Dev.kilo.md" ]]; then
  generate_mode_entry "$KILO_PROMPTS_DIR/Dev.kilo.md" "dev" "Developer" "Development work with ops-template integration" "Use when you need to implement features, write code, or develop software based on approved specifications"
fi

if [[ -f "$KILO_PROMPTS_DIR/QA.kilo.md" ]]; then
  generate_mode_entry "$KILO_PROMPTS_DIR/QA.kilo.md" "qa" "QA" "Quality assurance with ops-template integration" "Use when you need to test implementations, validate quality, or ensure acceptance criteria are met"
fi

if [[ -f "$KILO_PROMPTS_DIR/TeamLead.kilo.md" ]]; then
  generate_mode_entry "$KILO_PROMPTS_DIR/TeamLead.kilo.md" "team-lead" "Team Lead" "Team leadership with ops-template integration" "Use when you need to plan work, coordinate between roles, or manage project delivery and documentation standards"
fi

if [[ -f "$KILO_PROMPTS_DIR/ReleaseManager.kilo.md" ]]; then
  generate_mode_entry "$KILO_PROMPTS_DIR/ReleaseManager.kilo.md" "release-manager" "Release Manager" "Release management with ops-template integration" "Use for release planning, deployment coordination, and production readiness validation"
fi

if [[ -f "$KILO_PROMPTS_DIR/SRE.kilo.md" ]]; then
  generate_mode_entry "$KILO_PROMPTS_DIR/SRE.kilo.md" "sre" "SRE" "Site reliability engineering with ops-template integration" "Use for operational readiness, monitoring setup, incident response planning, and reliability engineering"
fi

echo "✅ Generated .kilocodemodes with $(grep -c "slug:" "$OUTPUT_FILE") modes"
echo ""
echo "📁 Output file: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the generated .kilocodemodes file"
echo "2. Run ./scripts/sync-kilo-settings.sh to distribute to all projects"
echo "3. Test mode switching in kilo"