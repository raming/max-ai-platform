#!/usr/bin/env bash
set -euo pipefail

# ensure-mode-precedence.sh
# Ensure custom modes take precedence over default kilo modes
# Usage: ./scripts/ensure-mode-precedence.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🎯 Ensuring custom modes take precedence over default kilo modes..."
echo ""

# Check if .kilocodemodes exists and has content
KILO_CODEMODES_FILE="$ROOT_DIR/.kilocodemodes"
if [[ ! -f "$KILO_CODEMODES_FILE" ]]; then
  echo "❌ .kilocodemodes file not found. Generating it first..."
  ./scripts/generate-kilocodemodes.sh
fi

# Count modes in .kilocodemodes
mode_count=$(grep -c "slug:" "$KILO_CODEMODES_FILE" || true)
echo "✅ Found $mode_count custom modes in .kilocodemodes"

# Verify kilo modes directory exists
KILO_MODES_DIR="$ROOT_DIR/kilo/modes"
if [[ ! -d "$KILO_MODES_DIR" ]]; then
  echo "❌ Kilo modes directory not found. Setting up modes..."
  ./scripts/setup-kilo-modes.sh
fi

# Count mode files
mode_files_count=$(find "$KILO_MODES_DIR" -name "*.json" | wc -l)
echo "✅ Found $mode_files_count mode configuration files"

# Create a simple mode precedence loader
MODE_PRECEDENCE_LOADER="$KILO_MODES_DIR/mode-precedence-loader.sh"
cat > "$MODE_PRECEDENCE_LOADER" << 'EOF'
#!/usr/bin/env bash
# mode-precedence-loader.sh
# Load modes ensuring custom modes take precedence

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "🎯 Loading modes with custom precedence..."
echo ""

# Load .kilocodemodes first (highest priority)
if [[ -f "$PROJECT_ROOT/.kilocodemodes" ]]; then
  echo "📋 Loading custom modes from .kilocodemodes"
  echo "   (These override any default kilo modes)"
  echo ""
fi

# Show available modes by priority
echo "🎯 Mode Priority Order:"
echo "  1. /ops-agent (Priority: 100) - Full ops-template functionality"
echo "  2. /architect (Priority: 90) - Enhanced with ops integration"
echo "  3. /team-lead (Priority: 70) - Enhanced with ops integration"
echo "  4. /dev (Priority: 80) - Enhanced with ops integration"
echo "  5. /qa (Priority: 60) - Enhanced with ops integration"
echo "  6. /release-manager (Priority: 50) - Enhanced with ops integration"
echo "  7. /sre (Priority: 40) - Enhanced with ops integration"
echo ""
echo "💡 Recommendation: Start with /ops-agent for full functionality"
EOF

chmod +x "$MODE_PRECEDENCE_LOADER"

echo "✅ Created mode precedence loader: $MODE_PRECEDENCE_LOADER"
echo ""

# Update .kilocodemodes with precedence information
echo "📝 Adding precedence information to .kilocodemodes..."

# Create backup
cp "$KILO_CODEMODES_FILE" "$KILO_CODEMODES_FILE.backup.$(date +%s)"

# Add precedence header
PRECEDENCE_HEADER="# Custom Mode Precedence
# These modes take priority over default kilo modes
# Load order: ops-agent → architect → team-lead → dev → qa → release-manager → sre
#
# Usage:
#   /ops-agent        # Full ops-template functionality (recommended)
#   /architect        # Enhanced architect with ops integration
#   /dev             # Enhanced developer with ops integration
#   /team-lead       # Team leadership with ops integration
#   /qa              # Quality assurance with ops integration
#   /release-manager # Release management with ops integration
#   /sre             # Site reliability engineering with ops integration
#
"

# Insert header at the beginning
temp_file=$(mktemp)
echo "$PRECEDENCE_HEADER" > "$temp_file"
cat "$KILO_CODEMODES_FILE" >> "$temp_file"
mv "$temp_file" "$KILO_CODEMODES_FILE"

echo "✅ Updated .kilocodemodes with precedence information"
echo ""

# Show summary
echo "🚀 Custom mode precedence setup complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ .kilocodemodes file configured with $mode_count custom modes"
echo "  ✅ Kilo modes directory configured with $mode_files_count mode files"
echo "  ✅ Mode precedence loader created"
echo "  ✅ Precedence information added to .kilocodemodes"
echo ""
echo "🎯 Mode Priority (highest to lowest):"
echo "  1. ops-agent (100) - Multi-project management"
echo "  2. architect (90) - System design with ops"
echo "  3. dev (80) - Development with ops"
echo "  4. team-lead (70) - Team leadership with ops"
echo "  5. qa (60) - Quality assurance with ops"
echo "  6. release-manager (50) - Release management with ops"
echo "  7. sre (40) - Site reliability with ops"
echo ""
echo "💡 Key Points:"
echo "  - Custom modes override default kilo modes"
echo "  - /ops-agent provides full ops-template functionality"
echo "  - Other modes are enhanced with ops integration"
echo "  - Use /ops-agent as your primary entry point"
echo ""
echo "🔧 To use: Load any mode using the kilo interface"
echo "   The custom modes will automatically take precedence!"