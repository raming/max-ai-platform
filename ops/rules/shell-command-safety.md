# Shell Command Safety Rules (Canonical)

Purpose
Prevent shell escaping issues and command failures that disrupt agent workflow and provide no functional value.

## Core Problem
**Agents generate commands with problematic shell escaping**, causing `dquote>`, `squote>`, or other shell continuation prompts that break workflow and provide no functional benefit.

## 🚫 **FORBIDDEN Command Patterns**

### Problematic Git Commit Messages
**❌ NEVER DO THIS**:
```bash
# Causes dquote> prompt due to embedded quotes and special characters
git commit -m "feat: Add "smart" quotes and special chars like — and ✅"

# Causes shell parsing issues with newlines
git commit -m "Multi-line message
with unescaped newlines"

# Overly complex escaping that breaks
git commit -m "Message with \\"nested\\" quotes and $variables"
```

**✅ ALWAYS DO THIS**:
```bash
# Simple, functional commit messages
git commit -m "feat: Add quote handling and special character support"

# Multi-line using proper quoting
git commit -m "feat: Add feature gate system

- Core interfaces implemented
- File adapter working
- Tests passing"
```

### Problematic Command Construction
**❌ NEVER DO THIS**:
```bash
# Complex variable substitution in quotes  
echo "The user said: \"$USER_INPUT\" and we replied: \"$RESPONSE\""

# Unescaped special characters
curl -d "{"name": "value"}" api.com

# Mixed quote types causing confusion
echo 'Don't use mixed quotes like "this"'
```

**✅ ALWAYS DO THIS**:
```bash
# Simple, functional commands
echo "User input received and response sent"

# Proper JSON escaping
curl -d '{"name": "value"}' api.com

# Consistent quote usage
echo "Use consistent quoting throughout"
```

## ✅ **SAFE Command Practices**

### Git Commit Messages
**Rules**:
1. **Single-line commits**: Use simple, descriptive messages
2. **No special characters**: Stick to alphanumeric, spaces, hyphens, colons
3. **No embedded quotes**: Avoid quotes within commit messages
4. **Use conventional format**: `type(scope): description`

**Examples**:
```bash
✅ git commit -m "feat: implement user authentication"
✅ git commit -m "fix(api): resolve timeout issue in auth endpoint"  
✅ git commit -m "docs: update installation guide"
✅ git commit -m "refactor: simplify user service logic"
```

### Multi-line Commits (When Necessary)
**Use HERE documents for complex messages**:
```bash
git commit -F - <<EOF
feat: implement feature gate system

- Core interfaces and ports defined
- File-based adapter implemented  
- Caching with ETag support
- Unit tests with 95% coverage
- Ready for integration testing
EOF
```

### Command Safety Checks
**Before executing ANY command, verify**:
1. **No unmatched quotes**: Count opening and closing quotes
2. **No special shell characters**: Avoid `$`, `!`, backticks in strings
3. **Simple variable usage**: Use variables outside of quoted strings when possible
4. **Test with echo first**: For complex commands, test construction with echo

## 🛡️ **Error Recovery Protocol**

### When `dquote>` Appears
```bash
# IMMEDIATE RECOVERY - Cancel the broken command
Ctrl+C

# OR provide closing quote if simple
"

# Verify you're back to normal prompt
echo "Shell context restored"
```

### When Shell is Confused
```bash
# Reset shell state
reset

# Or start fresh
exit
# (then restart terminal/agent)
```

## 📋 **Command Construction Templates**

### Safe Git Operations
```bash
# Simple commits
git commit -m "type: brief description"

# With body using HERE doc
git commit -F - <<EOF  
type: brief description

Longer explanation if needed
without problematic characters
EOF

# Amending commits safely
git commit --amend -m "corrected commit message"
```

### Safe File Operations  
```bash
# Reading files
cat filename.txt
less filename.txt

# Writing files (use heredoc for complex content)
cat > filename.txt <<EOF
Content here
without shell escaping issues  
EOF
```

### Safe API Calls
```bash
# Simple JSON
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' url

# Complex JSON using files
echo '{"complex": "json", "with": ["arrays"]}' > payload.json
curl -X POST -H "Content-Type: application/json" -d @payload.json url
```

## 🎯 **Agent Behavior Rules**

### Command Generation Guidelines
**✅ DO**:
- Use simple, functional commands
- Test command construction with echo first
- Use HERE documents for multi-line content
- Prefer files over complex inline strings
- Use consistent quoting (prefer single quotes for JSON, double for text)

**❌ DON'T**:
- Put quotes inside commit messages
- Use special shell characters unnecessarily  
- Mix quote types in the same command
- Create "decorative" output that breaks shell parsing
- Use complex variable substitution in quoted strings

### When Commands Fail
**Protocol**:
1. **Recognize shell continuation prompts** (`dquote>`, `squote>`, `>`)
2. **Cancel immediately** with Ctrl+C
3. **Simplify the command** removing problematic characters
4. **Test with echo** before re-executing
5. **Use HERE documents** for complex content

## 📊 **Common Failure Patterns**

### Pattern 1: Decorative Commit Messages
**Problem**: Agents try to make commits "pretty" with special characters
**Solution**: Keep commits functional and simple

### Pattern 2: Copy-Paste from Documentation  
**Problem**: Agents copy examples with problematic shell syntax
**Solution**: Adapt examples for safe shell usage

### Pattern 3: Over-Escaping
**Problem**: Agents add too many escape characters trying to be safe
**Solution**: Use HERE documents or files instead of complex escaping

### Pattern 4: Variable Substitution in Quotes
**Problem**: Variables inside quoted strings causing parsing issues
**Solution**: Construct strings outside quotes, then use as single variables

## 🔧 **Testing Commands Before Execution**

### Safe Command Testing
```bash
# Test command construction
cmd="git commit -m"
msg="feat: implement new feature"
echo $cmd "$msg"
# Verify output looks correct, then execute
$cmd "$msg"
```

### Multi-line Content Testing
```bash
# Test HERE document construction
cat <<EOF
This is a test of the content
that will be used in the actual command
EOF
# If it looks correct, use in actual command
```

## 📝 **Examples: Before and After**

### Example 1: Git Commits
**❌ Before (Problematic)**:
```bash
git commit -m "feat: Add "smart" features with ✅ checkmarks and — dashes"
# Causes: dquote> prompt
```

**✅ After (Safe)**:
```bash
git commit -m "feat: Add smart features with checkmarks and enhanced formatting"
```

### Example 2: API Calls
**❌ Before (Problematic)**:
```bash
curl -d "{"name": "$USER", "action": "login"}" api.com
# Causes: Shell parsing errors
```

**✅ After (Safe)**:
```bash
curl -d '{"name": "user", "action": "login"}' api.com
# OR using variables properly:
json='{"name": "user", "action": "login"}'
curl -d "$json" api.com
```

---

## Summary

**Goal**: Generate **functional, reliable commands** that accomplish the task without shell escaping issues. Avoid "decorative" elements that provide no functional value but break shell parsing.

**Remember**: Simple, functional commands are better than complex, "pretty" commands that fail.