# Stub Method Detection

This script helps track unimplemented prototype methods created by AI agents during development. It ensures that scaffolding code is properly marked and can be revisited when features are implemented.

## Purpose

AI agents often create prototype functions that are never filled out. This tool provides a systematic way to:
- Mark unimplemented methods with standardized error messages
- Automatically detect and report stub methods in CI
- Ensure scaffolding code is tracked and revisited during feature implementation

## Usage

### Basic Usage
```bash
# Scan current directory
npm run detect-stubs

# Scan specific directory
node scripts/detect-stubs.js /path/to/code
```

### CI Integration
The script exits with code 1 if stub methods are found, making it suitable for CI pipelines:

```yaml
- name: Check for stub methods
  run: npm run detect-stubs
```

## How to Mark Stub Methods

### TypeScript/JavaScript
```typescript
function processUserData(userId: string): UserData {
  throw new NotImplementedError('processUserData: User data processing logic not yet implemented');
}
```

### Python
```python
def process_user_data(user_id: str) -> UserData:
    raise NotImplementedError("process_user_data: User data processing logic not yet implemented")
```

### Go
```go
func ProcessUserData(userId string) (*UserData, error) {
    return nil, fmt.Errorf("ProcessUserData: user data processing logic not yet implemented")
}
```

### Java
```java
public UserData processUserData(String userId) {
    throw new UnsupportedOperationException("processUserData: User data processing logic not yet implemented");
}
```

### C#
```csharp
public UserData ProcessUserData(string userId) {
    throw new NotImplementedException("ProcessUserData: User data processing logic not yet implemented");
}
```

## Error Message Format

Use the standardized format: `{MethodName}: {Brief description} not yet implemented`

Examples:
- `processPayment: Payment processing integration not yet implemented - requires Stripe setup`
- `validatePermissions: Permission validation logic not yet implemented - requires role-based access control`
- `sendNotification: Email notification system not yet implemented - requires SMTP configuration`

## What Gets Detected

The script detects various patterns across multiple languages:
- `NotImplementedError` exceptions
- `UnsupportedOperationException`
- `NotImplementedException`
- Error messages containing "not yet implemented", "not implemented", or "TODO"

## What Gets Excluded

- Documentation files (`.md`)
- Dependencies (`node_modules/`)
- Build artifacts (`dist/`, `build/`)
- Cache directories (`__pycache__/`, `.next/`)
- Git directories (`.git/`)

## Output Format

When stub methods are found:
```
🔍 Found 3 stub method(s) in the codebase:

📁 src/services/payment.ts:
  ⏳ Line 45: processPayment: Payment processing integration not yet implemented
  ❌ Line 78: validateCard: Card validation logic not yet implemented

📁 src/utils/helpers.py:
  📝 Line 23: formatDate: Date formatting utility not yet implemented
```

When no stubs are found:
```
✅ No stub methods found in the codebase.
✅ All methods are implemented!
```

## Integration with Development Workflow

1. **During Development**: AI agents mark unimplemented methods with proper error messages
2. **Pre-commit**: Run `npm run detect-stubs` to catch any unmarked stubs
3. **CI/CD**: Include stub detection in automated pipelines
4. **Code Review**: Reviewers can see which methods are still stubs
5. **Feature Implementation**: Use stub reports to identify what needs to be implemented

## Best Practices

- **Be Specific**: Include context about why the method isn't implemented (missing dependencies, external APIs, etc.)
- **Use Method Names**: Always start with the method name for easy identification
- **Regular Reviews**: Periodically review stub methods to ensure they're still needed
- **Documentation**: Consider documenting stub methods in task trackers or ADRs
- **Testing**: Exclude stub methods from test coverage requirements since they're intentionally incomplete