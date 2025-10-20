#!/usr/bin/env bash
set -euo pipefail

# regenerate-kilo-merged-prompts.sh
# Regenerate merged prompts in kilo/prompts/merged/ with correct seat names
# Usage:
#   ./scripts/regenerate-kilo-merged-prompts.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MERGER="$ROOT_DIR/scripts/merge-role-prompt.sh"
OUTPUT_DIR="$ROOT_DIR/kilo/prompts/merged"

# Use ops-template as the project context for generating kilo prompts
PROJECT_OPS_DIR="$ROOT_DIR"

echo "🔄 Regenerating merged prompts for kilo with correct seat names..."
echo ""

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Generate role prompts with correct seat names
generate_role_prompt() {
    local role="$1"
    local seat_name="$2"
    local full_seat="$role.$seat_name"
    
    # Convert role to title case for filename
    case "$role" in
        "team_lead") title_role="TeamLead" ;;
        "release_manager") title_role="ReleaseManager" ;;
        "qa") title_role="QA" ;;
        "sre") title_role="SRE" ;;
        *) title_role="$(tr '[:lower:]' '[:upper:]' <<< "${role:0:1}")$(tr '[:upper:]' '[:lower:]' <<< "${role:1}")" ;;
    esac
    
    output_file="$OUTPUT_DIR/${title_role}.kilo.md"
    
    echo "📄 Generating $title_role (seat: $full_seat) -> $output_file"
    ROLE="$role" SEAT="$full_seat" PROJECT_OPS_DIR="$PROJECT_OPS_DIR" "$MERGER" > "$output_file"
}

# Generate each role
generate_role_prompt "architect" "morgan-lee"
generate_role_prompt "team_lead" "casey-brooks"
generate_role_prompt "dev" "avery-kim"
generate_role_prompt "qa" "mina-li"
generate_role_prompt "release_manager" "rohan-patel"
generate_role_prompt "sre" "devon-singh"

# Generate Ops-Agent prompt
echo "📄 Generating OpsAgent (seat: ops-agent.ops-template-support) -> $OUTPUT_DIR/OpsAgent.kilo.md"
ROLE="ops_agent" SEAT="ops-agent.ops-template-support" PROJECT_OPS_DIR="$PROJECT_OPS_DIR" "$MERGER" > "$OUTPUT_DIR/OpsAgent.kilo.md"

echo ""
echo "✅ Regenerated all merged prompts with correct seat names!"
echo ""
echo "Next steps:"
echo "1. Run ./scripts/generate-kilocodemodes.sh to update .kilocodemodes"
echo "2. Run ./scripts/sync-all-projects.sh -w to sync to all projects"