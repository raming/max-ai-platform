# M1 Security Remediation Plan - Critical Security Violations

**Status: EMERGENCY REMEDIATION**  
**Priority: P0 - BLOCKS M1 MILESTONE**  
**Created**: 2025-10-05  
**Owner**: seat:architect.morgan-lee  

## Executive Summary

QA validation (QA-RES-01 #44) has identified critical security violations that fundamentally violate our architectural security principles and block M1 milestone deployment. This plan provides immediate remediation steps to resolve P0 security issues.

## 🚨 Critical Security Violations Identified

### 1. Secrets Exposed in Repository
**File**: `client/.env`  
**Violation**: Multiple API keys and tokens stored in plaintext
**Risk Level**: CRITICAL - Credential compromise, compliance violation

**Exposed Credentials**:
- Supabase connection strings with passwords
- GHL admin tokens and API keys
- Twilio authentication tokens  
- OpenRouter API keys
- n8n API tokens

### 2. Architectural Security Requirements Bypassed
Per ADR-0008 and m1-token-proxy-security-assessment.md:
- **Secrets Manager Integration**: Not implemented
- **Token Proxy Pattern**: Completely bypassed
- **Zero Secrets in Logs**: Cannot be guaranteed
- **Cross-tenant Isolation**: Security boundaries not enforced

### 3. Implementation Status Gap
- ❌ Resource Initialization System: Not implemented
- ❌ Token Proxy Integration: Not implemented  
- ❌ Security Controls: Missing entirely
- ✅ Feature Flags Framework: Complete (only working component)

## 📋 IMMEDIATE REMEDIATION ACTIONS

### Phase 1: Emergency Credential Security (Day 1)

#### Action 1.1: Immediate Credential Removal
**Owner**: DEV team  
**Timeline**: IMMEDIATE (within 2 hours)

```bash
# Remove all secrets from .env files
cd /Users/rayg/repos/max-ai/platform/client
rm .env
echo "# Environment variables - use secrets manager only" > .env.template

# Create secure environment template
cat > .env.template << 'EOF'
# Template for environment variables
# DO NOT PUT ACTUAL SECRETS HERE
# Use secrets manager for all credentials

# Application Configuration
NODE_ENV=development
API_PORT=3000
LOG_LEVEL=info

# Secrets Manager Configuration
SECRETS_MANAGER_REGION=us-east-1
# All actual API keys loaded via secrets manager
EOF

# Commit the removal
git add .env.template
git commit -m "security: Remove exposed credentials from .env files

- Removed all plaintext API keys and tokens
- Created .env.template for configuration guidance  
- Implements emergency credential security per M1 remediation plan

Refs: QA-RES-01 security violation escalation"
```

#### Action 1.2: Rotate All Compromised Credentials
**Owner**: RM + External service owners  
**Timeline**: Within 4 hours

**Services Requiring Key Rotation**:
1. **Supabase**: Generate new service role and anon keys
2. **GHL**: Revoke and regenerate admin tokens
3. **Twilio**: Rotate auth tokens
4. **OpenRouter**: Generate new API key
5. **n8n**: Update API tokens

### Phase 2: Secrets Management Infrastructure (Day 1-2)

#### Action 2.1: Deploy Secrets Manager
**Owner**: DEV/SRE teams  
**Timeline**: Day 1-2

**Implementation Options (in order of preference)**:

1. **AWS Secrets Manager** (Recommended)
```typescript
// api-gateway/src/config/secrets.service.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsService {
  private client = new SecretsManager({ region: 'us-east-1' });
  
  async getSecret(secretName: string): Promise<string> {
    const result = await this.client.getSecretValue({
      SecretId: secretName
    });
    return result.SecretString;
  }
}
```

2. **Azure Key Vault** (Alternative)
3. **Environment-based secrets manager** (Development only)

#### Action 2.2: Secure Credential Storage
**Owner**: DEV team  
**Timeline**: Day 2

**Required Secret Store Entries**:
```json
{
  "maxai/dev/supabase": {
    "connection_string": "postgresql://...",
    "anon_key": "eyJ...",
    "service_role_key": "eyJ..."
  },
  "maxai/dev/ghl": {
    "admin_token": "eyJ...",
    "api_key": "eyJ..."
  },
  "maxai/dev/twilio": {
    "account_sid": "AC...",
    "auth_token": "..."
  },
  "maxai/dev/openrouter": {
    "api_key": "sk-or-v1-..."
  },
  "maxai/dev/n8n": {
    "api_key": "eyJ...",
    "endpoint": "https://..."
  }
}
```

### Phase 3: Token Proxy Implementation (Day 2-3)

#### Action 3.1: Implement Token Proxy in api-gateway
**Owner**: DEV team  
**Timeline**: Day 2-3

**Core Implementation Requirements**:

```typescript
// api-gateway/src/providers/token-proxy.service.ts
@Injectable()
export class TokenProxyService {
  constructor(
    private secrets: SecretsService,
    private logger: Logger,
    private audit: AuditService
  ) {}
  
  async executeSupabaseOperation(
    operation: SupabaseOperation,
    tenantId: string,
    userId: string,
    correlationId: string
  ): Promise<any> {
    // 1. Validate tenant access
    await this.validateTenantAccess(tenantId, userId);
    
    // 2. Get secure credentials (never logged)
    const credentials = await this.secrets.getSecret(`maxai/${process.env.NODE_ENV}/supabase`);
    
    // 3. Execute operation with audit logging
    this.audit.log({
      action: 'supabase.operation',
      tenantId,
      userId,
      correlationId,
      operation: operation.type,
      // NO SECRETS LOGGED
    });
    
    // 4. Execute via Supabase client
    return await this.supabaseClient.execute(operation, credentials);
  }
}
```

#### Action 3.2: Resource Initialization Endpoints
**Owner**: DEV team  
**Timeline**: Day 3

**Required Endpoints** (with security controls):
```typescript
// POST /templates/{id}/resources
@Post('templates/:id/resources')
async initializeResources(
  @Param('id') templateId: string,
  @Body() plan: ResourceInitializationPlan,
  @Headers('x-correlation-id') correlationId: string,
  @Request() req: AuthenticatedRequest
) {
  // Security validation first
  await this.rbac.authorize(req.user, 'resource:initialize', templateId);
  
  // Use token proxy for all provider operations
  return await this.tokenProxy.executeResourcePlan(
    plan, 
    req.user.tenantId, 
    req.user.id, 
    correlationId
  );
}
```

### Phase 4: Security Validation and QA Re-engagement (Day 3-4)

#### Action 4.1: Security Test Execution
**Owner**: DEV team  
**Timeline**: Day 3

**Required Security Tests**:
1. **Secrets Scanning**: Verify no credentials in logs/responses
2. **Cross-tenant Isolation**: Validate tenant boundaries
3. **Token Proxy Security**: Confirm secure credential handling
4. **Audit Logging**: Verify comprehensive audit trail

```bash
# Security validation commands
echo "Running security validation..."

# Test 1: No secrets in logs
grep -r "anon_key\|service_role\|auth_token" logs/ && echo "❌ SECURITY ISSUE: Found keys in logs" || echo "✅ No secrets in logs"

# Test 2: Token proxy endpoints don't expose credentials  
curl -v http://localhost:3000/api/resources/init | grep -i "supabase.*key" && echo "❌ SECURITY ISSUE: Keys in response" || echo "✅ No secrets in responses"

# Test 3: Cross-tenant isolation
# (Test client A cannot access client B resources)

echo "Security validation complete"
```

#### Action 4.2: QA Re-engagement
**Owner**: QA team (seat:qa.mina-li)  
**Timeline**: Day 4

**QA Validation Scope**:
- Execute comprehensive security test suite
- Validate zero secrets exposure scenarios
- Confirm cross-tenant isolation enforcement  
- Verify token proxy security controls
- Test ResourceInitializationPlan execution with audit trail

## 📐 Updated Implementation Architecture

### Security-First Implementation Order

1. **FIRST**: Secrets management infrastructure
2. **SECOND**: Token proxy with secure credential handling
3. **THIRD**: Resource initialization endpoints WITH security controls
4. **FOURTH**: Feature development (only after security validated)

### Architectural Compliance Checklist

**P0 Security Controls (REQUIRED)**:
- [ ] All secrets removed from repository
- [ ] Secrets manager integration functional
- [ ] Token proxy handles all provider access
- [ ] Zero secrets in logs (validated with tests)
- [ ] Cross-tenant isolation enforced
- [ ] Comprehensive audit logging

**P1 Security Hardening (RECOMMENDED)**:
- [ ] Automated key rotation capability
- [ ] Security monitoring and alerting  
- [ ] Rate limiting per tenant/client
- [ ] Enhanced error handling (no info leakage)

## 🎯 Success Criteria

### Phase 1 Success (Emergency Remediation)
- [ ] All credentials removed from repository
- [ ] All exposed credentials rotated
- [ ] No secrets detectable in codebase scan

### Phase 2 Success (Infrastructure)  
- [ ] Secrets manager operational
- [ ] All credentials securely stored
- [ ] Development environment using secrets manager

### Phase 3 Success (Token Proxy)
- [ ] Token proxy operational in api-gateway
- [ ] All Supabase access goes through proxy
- [ ] Resource initialization endpoints functional

### Phase 4 Success (Validation)
- [ ] All security tests pass
- [ ] QA validation complete  
- [ ] M1 milestone unblocked

## 📊 Impact Assessment

### Timeline Impact
- **Original M1 Timeline**: Week 1-2
- **Revised M1 Timeline**: Week 2-3 (1 week delay for security remediation)
- **Critical Path**: Security infrastructure → Token proxy → QA validation

### Resource Impact
- **DEV Team**: Full focus on security remediation (Day 1-3)
- **QA Team**: Re-engagement after security implementation complete
- **RM Team**: Credential rotation and environment management

### Risk Mitigation
- **Immediate**: Credential exposure eliminated
- **Short-term**: Proper security controls implemented
- **Long-term**: Architectural compliance maintained

## 📋 Escalation and Communication

### Daily Status Updates Required
**Format**: Issue comment on QA-RES-01 #44  
**Frequency**: End of each day until resolved
**Content**: Progress against checklist, blockers, next day plan

### Escalation Triggers
- **Day 2**: If secrets manager not operational
- **Day 3**: If token proxy not functional
- **Day 4**: If QA validation blocked

### Success Communication
- **Internal**: M1 milestone status update
- **QA Team**: Formal re-engagement request
- **Development**: Clear to proceed with feature work

## 📚 References

- QA Issue: QA-RES-01 #44
- Security Assessment: docs/release/m1-token-proxy-security-assessment.md  
- ADR-0008: Security/Compliance Baseline
- Phase 1 Plan: docs/release/phase-1.md

---

**CONCLUSION**: This remediation plan addresses all P0 security violations identified by QA and establishes proper security foundations for M1 milestone. Implementation must be completed before any feature development proceeds.

**Next Actions**: 
1. DEV team begins Phase 1 (credential removal) immediately
2. RM coordinates credential rotation with external services  
3. Daily progress updates on QA-RES-01 #44 until resolution