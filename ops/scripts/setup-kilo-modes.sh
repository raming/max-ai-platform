#!/usr/bin/env bash
set -euo pipefail

# setup-kilo-modes.sh
# Set up Kilo modes integration with ops-template agents
# Usage: ./scripts/setup-kilo-modes.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Setting up Kilo modes integration with ops-template..."
echo ""

# Check if Kilo prompts exist
KILO_PROMPTS_DIR="$ROOT_DIR/kilo/prompts/merged"
if [[ ! -d "$KILO_PROMPTS_DIR" ]]; then
  echo "❌ Kilo prompts not found. Generating them first..."
  ./scripts/sync-kilo-prompts.sh
fi

# Count available prompts
prompt_count=$(find "$KILO_PROMPTS_DIR" -name "*.kilo.md" | wc -l)
echo "✅ Found $prompt_count Kilo prompts"

# Create Kilo modes directory
KILO_MODES_DIR="$ROOT_DIR/kilo/modes"
mkdir -p "$KILO_MODES_DIR"

echo ""
echo "📋 Creating Kilo mode configurations..."

# Create ops-agent mode configuration (highest priority)
cat > "$KILO_MODES_DIR/ops-agent.json" << 'EOF'
{
  "name": "Ops Agent",
  "slug": "ops-agent",
  "description": "Multi-agent workflow management and project synchronization",
  "trigger": "/ops-agent",
  "prompt_file": "kilo/prompts/merged/OpsAgent.kilo.md",
  "capabilities": [
    "project_management",
    "rule_synchronization",
    "multi_agent_coordination",
    "github_issue_integration"
  ],
  "quick_commands": [
    "/ops-agent",
    "/sync_projects",
    "/list_agents",
    "/agent_status"
  ],
  "priority": 100,
  "load_first": true
}
EOF

# Create enhanced modes for existing roles (override defaults)
cat > "$KILO_MODES_DIR/architect.json" << 'EOF'
{
  "name": "Enhanced Architect",
  "slug": "architect",
  "description": "System design with ops-template integration",
  "trigger": "/architect",
  "prompt_file": "kilo/prompts/merged/Architect.kilo.md",
  "capabilities": [
    "system_design",
    "architecture_governance",
    "specification_writing",
    "project_management"
  ],
  "priority": 90,
  "overrides_default": true
}
EOF

cat > "$KILO_MODES_DIR/code.json" << 'EOF'
{
  "name": "Enhanced Developer",
  "slug": "dev",
  "description": "Development work with ops-template integration",
  "trigger": "/code",
  "prompt_file": "kilo/prompts/merged/Dev.kilo.md",
  "capabilities": [
    "coding",
    "testing",
    "issue_management",
    "agent_coordination"
  ],
  "priority": 80,
  "overrides_default": true
}
EOF

# Create additional custom modes
cat > "$KILO_MODES_DIR/team-lead.json" << 'EOF'
{
  "name": "Team Lead",
  "slug": "team-lead",
  "description": "Team leadership with ops-template integration",
  "trigger": "/team-lead",
  "prompt_file": "kilo/prompts/merged/TeamLead.kilo.md",
  "capabilities": [
    "project_planning",
    "team_coordination",
    "delivery_management",
    "ops_integration"
  ],
  "priority": 70
}
EOF

cat > "$KILO_MODES_DIR/debug.json" << 'EOF'
{
  "name": "Enhanced QA",
  "slug": "qa",
  "description": "Quality assurance with ops-template integration",
  "trigger": "/debug",
  "prompt_file": "kilo/prompts/merged/QA.kilo.md",
  "capabilities": [
    "testing",
    "quality_assurance",
    "acceptance_criteria",
    "ops_integration"
  ],
  "priority": 60,
  "overrides_default": true
}
EOF

cat > "$KILO_MODES_DIR/release-manager.json" << 'EOF'
{
  "name": "Release Manager",
  "slug": "release-manager",
  "description": "Release management with ops-template integration",
  "trigger": "/release-manager",
  "prompt_file": "kilo/prompts/merged/ReleaseManager.kilo.md",
  "capabilities": [
    "release_planning",
    "deployment_coordination",
    "production_readiness",
    "ops_integration"
  ],
  "priority": 50
}
EOF

cat > "$KILO_MODES_DIR/sre.json" << 'EOF'
{
  "name": "SRE",
  "slug": "sre",
  "description": "Site reliability engineering with ops-template integration",
  "trigger": "/sre",
  "prompt_file": "kilo/prompts/merged/SRE.kilo.md",
  "capabilities": [
    "operational_readiness",
    "monitoring_setup",
    "incident_response",
    "ops_integration"
  ],
  "priority": 40
}
EOF

echo "✅ Created mode configurations in: $KILO_MODES_DIR"
echo ""

# Create mode loader script
cat > "$KILO_MODES_DIR/load-mode.sh" << 'EOF'
#!/usr/bin/env bash
# Load a specific Kilo mode with ops-template integration

MODE=${1:-}
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ -z "$MODE" ]]; then
  echo "Usage: $0 <mode>" >&2
  echo "Available modes:" >&2
  ls -1 "$PROJECT_ROOT/kilo/modes" | grep "\.json$" | sed 's/\.json$//' | sed 's/^/  /' >&2
  exit 1
fi

MODE_FILE="$PROJECT_ROOT/kilo/modes/$MODE.json"
PROMPT_FILE="$PROJECT_ROOT/kilo/prompts/merged/$(echo "$MODE" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}').kilo.md"

if [[ ! -f "$MODE_FILE" ]]; then
  echo "❌ Mode configuration not found: $MODE_FILE" >&2
  exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "❌ Prompt file not found: $PROMPT_FILE" >&2
  echo "Run: ./scripts/sync-kilo-prompts.sh" >&2
  exit 1
fi

echo "🔄 Loading $MODE mode..."
echo "📄 Configuration: $MODE_FILE"
echo "🤖 Prompt: $PROMPT_FILE"
echo ""

# Output the prompt for Kilo to load
cat "$PROMPT_FILE"
EOF

chmod +x "$KILO_MODES_DIR/load-mode.sh"

echo "📋 Mode loader script created: $KILO_MODES_DIR/load-mode.sh"
echo ""

# Show available modes
echo "🎯 Available Kilo modes with ops-template integration:"
echo ""

modes=("ops-agent" "architect" "dev" "team-lead" "qa" "release-manager" "sre")
for mode in "${modes[@]}"; do
  if [[ -f "$KILO_MODES_DIR/$mode.json" ]]; then
    name=$(jq -r '.name' "$KILO_MODES_DIR/$mode.json")
    trigger=$(jq -r '.trigger' "$KILO_MODES_DIR/$mode.json")
    desc=$(jq -r '.description' "$KILO_MODES_DIR/$mode.json")
    priority=$(jq -r '.priority // "N/A"' "$KILO_MODES_DIR/$mode.json")
    echo "  $trigger → $name (Priority: $priority)"
    echo "      $desc"
    echo ""
  fi
done

echo "💡 Mode Loading Priority:"
echo "  1. ops-agent (highest - full ops-template functionality)"
echo "  2. architect (enhanced with ops integration)"
echo "  3. team-lead (enhanced with ops integration)"
echo "  4. dev (enhanced with ops integration)"
echo "  5. qa (enhanced with ops integration)"
echo "  6. release-manager (enhanced with ops integration)"
echo "  7. sre (enhanced with ops integration)"
echo ""

echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Load any mode: $KILO_MODES_DIR/load-mode.sh <mode>"
echo "2. Or copy/paste prompts directly into Kilo"
echo "3. Use /ops_agent for full ops-template functionality"
echo ""
echo "💡 Pro tip: Save these prompts in Kilo for quick reuse!"