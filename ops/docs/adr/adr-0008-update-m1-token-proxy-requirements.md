# ADR-0008-UPDATE: M1 Token Proxy Security Requirements

**Status: APPROVED**  
**Date**: 2025-10-05  
**Update to**: ADR-0008 Security/Compliance Baseline  
**Context**: QA-RES-01 Security Violation Escalation  

## Context

QA validation has identified critical security violations that fundamentally violate ADR-0008 security requirements. This update provides specific, enforceable security controls for M1 token proxy implementation to prevent future violations.

## Updated Security Requirements

### 1. Secrets Management (MANDATORY)

**Requirement**: Zero secrets in repository files  
**Implementation**: All API keys, tokens, and credentials MUST be stored in a managed secrets service

**PROHIBITED**:
```bash
# ❌ NEVER ALLOWED - Any secrets in .env files
SUPABASE_PASSWORD=actual_password
GHL_API_KEY=eyJhbGciOiJIUzI1NiIs...
```

**REQUIRED**:
```typescript
// ✅ MANDATORY - Secrets via secrets manager only
@Injectable()
export class SecretsService {
  async getSecret(secretName: string): Promise<string> {
    // Must use managed secrets service (AWS Secrets Manager, Azure Key Vault, etc.)
    return await this.secretsManager.getSecretValue(secretName);
  }
}
```

### 2. Token Proxy Pattern (MANDATORY)

**Requirement**: All external provider access MUST go through token proxy  
**Implementation**: Zero direct client access to provider APIs

**Architecture Enforcement**:
```
✅ REQUIRED FLOW:
Client → api-gateway (token proxy) → External Provider

❌ PROHIBITED FLOW:  
Client → External Provider (direct access)
```

**Implementation Requirements**:
```typescript
// All provider operations must implement this pattern
class ProviderProxyService {
  async executeOperation(
    operation: ProviderOperation,
    tenantId: string,
    userId: string,
    correlationId: string
  ): Promise<any> {
    // 1. MANDATORY: Validate tenant access
    await this.validateTenantAccess(tenantId, userId);
    
    // 2. MANDATORY: Get credentials securely (never logged)
    const credentials = await this.secrets.getSecret(secretPath);
    
    // 3. MANDATORY: Audit log (no secrets)
    this.audit.log({
      action: operation.type,
      tenantId,
      userId, 
      correlationId
      // NO SECRETS LOGGED
    });
    
    // 4. MANDATORY: Execute with secure credentials
    return await this.providerClient.execute(operation, credentials);
  }
}
```

### 3. Zero Secrets in Logs (MANDATORY)

**Requirement**: No secrets, tokens, or credentials in logs, responses, or error messages  
**Implementation**: Comprehensive log redaction with automated testing

**Log Redaction Requirements**:
```typescript
// MANDATORY: Log redaction for all sensitive data
class SecureLogger {
  log(data: any) {
    const redacted = this.redactSecrets(data);
    this.logger.log(redacted);
  }
  
  private redactSecrets(obj: any): any {
    // Must redact: API keys, tokens, passwords, connection strings
    const sensitivePatterns = [
      /anon_key/,
      /service_role/,
      /auth_token/,
      /api_key/,
      /password/,
      /connection_string/
    ];
    // Implementation must handle all sensitive patterns
  }
}
```

### 4. Cross-Tenant Isolation (MANDATORY)

**Requirement**: Enforce tenant boundaries in all operations  
**Implementation**: Validate tenant access before every provider operation

**Security Boundary Enforcement**:
```typescript
// MANDATORY: Tenant isolation validation
async validateTenantAccess(tenantId: string, userId: string): Promise<void> {
  const userTenant = await this.iam.getUserTenant(userId);
  if (userTenant !== tenantId) {
    throw new ForbiddenError('Cross-tenant access denied');
  }
}
```

### 5. Comprehensive Audit Logging (MANDATORY)

**Requirement**: All resource operations logged with correlation IDs  
**Implementation**: Structured audit logs for all provider interactions

**Audit Log Format** (MANDATORY):
```json
{
  "timestamp": "2025-10-05T20:00:00Z",
  "action": "supabase.table.create",
  "tenantId": "tenant_123",
  "userId": "user_456", 
  "correlationId": "corr_789",
  "resource": "client_documents_table",
  "status": "success",
  "duration": 1250
  // NO SECRETS OR CREDENTIALS
}
```

## Implementation Checklist

### P0 Requirements (BLOCKING)
- [ ] **Secrets Manager Integration**: All credentials in managed secrets service
- [ ] **Token Proxy Functional**: All provider access via api-gateway proxy  
- [ ] **Zero Secrets in Logs**: Automated testing confirms no credential exposure
- [ ] **Cross-Tenant Isolation**: Enforced in all operations
- [ ] **Audit Logging**: Comprehensive trail with correlation IDs

### P1 Requirements (RECOMMENDED)  
- [ ] **Key Rotation**: Automated rotation with zero-downtime rollover
- [ ] **Security Monitoring**: Failed auth attempts and unusual patterns
- [ ] **Rate Limiting**: Per tenant/client limits on resource operations

## Architectural Authority

**ESCALATION REQUIREMENT**: Any deviation from these security requirements MUST be approved by Architect before implementation.

**BLOCKING AUTHORITY**: QA MUST NOT approve any implementation that violates these requirements.

**COMPLIANCE VALIDATION**: All implementations MUST pass security test suite before deployment.

## Testing Requirements

### Security Test Suite (MANDATORY)

**Test Categories**:
1. **Secrets Exposure Prevention**
   ```bash
   # Must pass: No secrets in logs/responses  
   grep -r "anon_key|service_role|auth_token" logs/ && exit 1 || exit 0
   ```

2. **Cross-Tenant Isolation**
   ```bash
   # Must pass: Client A cannot access Client B resources
   test_cross_tenant_access_denied()
   ```

3. **Token Proxy Security**
   ```bash
   # Must pass: All provider access via proxy only
   test_no_direct_provider_access()
   ```

4. **Audit Trail Completeness**
   ```bash
   # Must pass: All operations logged with correlation IDs
   test_audit_trail_complete()
   ```

## Compliance Integration

### CI/CD Pipeline Requirements
```yaml
# MANDATORY: Security gates in CI pipeline
security_validation:
  - secrets_scanning: "MUST_PASS"
  - log_redaction_test: "MUST_PASS" 
  - cross_tenant_isolation: "MUST_PASS"
  - audit_logging_validation: "MUST_PASS"
```

### Deployment Blocking
**Rule**: No deployment permitted until ALL P0 security requirements validated

## Risk Assessment

### CRITICAL RISKS (P0)
- **Credential Exposure**: Secrets in repository/logs → Immediate security breach
- **Cross-Tenant Access**: Isolation bypass → Data confidentiality violation
- **Audit Gap**: Missing correlation IDs → Compliance failure

### HIGH RISKS (P1)  
- **Token Proxy Bypass**: Direct provider access → Security control circumvention
- **Key Rotation Failure**: Manual intervention required → Operational risk

## Decision

**APPROVED**: These enhanced security requirements are MANDATORY for M1 implementation and all future development.

**ENFORCEMENT**: 
- Architect has BLOCKING authority on security violations
- QA MUST NOT approve implementations violating these requirements
- Development MUST implement security-first before feature development

## Consequences

### Positive
- Prevents credential exposure and compliance violations  
- Establishes robust security foundation for production deployment
- Ensures comprehensive audit trail for operations

### Negative  
- Increases initial implementation complexity
- Requires additional infrastructure setup (secrets manager)
- May slow initial development velocity

## References

- QA Issue: QA-RES-01 #44 (security violation escalation)
- Remediation Plan: docs/release/m1-security-remediation-plan.md
- Original ADR: docs/adr/adr-0008-security-compliance.md
- Security Assessment: docs/release/m1-token-proxy-security-assessment.md

---

**IMPLEMENTATION MANDATE**: All development teams MUST implement these security controls before proceeding with feature development. QA validation MUST confirm compliance before M1 milestone approval.