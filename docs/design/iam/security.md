# IAM Security

## Overview

This document defines the security controls, threat model, and mitigation strategies for the IAM component. Security is foundational to the MaxAI Platform's multi-tenant architecture.

## Threat Model

### Assets

**Critical Assets**:
- User credentials (OAuth tokens, session cookies)
- Service tokens (JWT for inter-service auth)
- User PII (email, name, profile data)
- Role assignments (access control mappings)
- Audit logs (compliance evidence)

**Asset Classification**:
| Asset | Confidentiality | Integrity | Availability |
|-------|----------------|-----------|--------------|
| **Session Tokens** | Critical | Critical | High |
| **Service Tokens** | Critical | Critical | High |
| **User PII** | High | High | Medium |
| **Role Assignments** | High | Critical | High |
| **Audit Logs** | Medium | Critical | High |

### Threat Actors

**External Attackers**:
- Motivation: Data theft, service disruption, credential theft
- Capabilities: Phishing, brute force, API abuse, session hijacking
- Attack Surface: Public web endpoints, OAuth flow

**Malicious Insiders**:
- Motivation: Data exfiltration, privilege escalation, sabotage
- Capabilities: Legitimate access, social engineering, abuse of permissions
- Attack Surface: Admin interfaces, database access, service APIs

**Compromised Services**:
- Motivation: Lateral movement, privilege escalation
- Capabilities: Valid service tokens, internal API access
- Attack Surface: Inter-service communication, shared infrastructure

---

## Attack Scenarios & Mitigations

### 1. OAuth Hijacking (CSRF Attack)

**Attack Flow**:
```
1. Attacker sends victim a malicious link with crafted OAuth state
2. Victim clicks link and completes OAuth flow
3. OAuth callback returns to attacker's controlled endpoint
4. Attacker obtains victim's session token
```

**Mitigation**:
- ✅ **State Parameter**: Random, server-generated, single-use CSRF token
- ✅ **Redirect URI Validation**: Only allow whitelisted redirect URIs
- ✅ **Session Binding**: Tie state token to user's browser session

**Implementation**:
```typescript
// Step 1: Generate state token
const state = crypto.randomBytes(32).toString('hex');
await redis.setex(`oauth_state:${state}`, 300, JSON.stringify({
  redirect_uri: req.query.redirect_uri,
  session_id: req.session.id
}));

// Step 2: Verify state token on callback
const storedState = await redis.get(`oauth_state:${req.query.state}`);
if (!storedState) {
  throw new Error('Invalid or expired state token');
}
await redis.del(`oauth_state:${req.query.state}`); // Single-use
```

**Detection**:
- Monitor for state token mismatches (alert on >10/hour)
- Log failed OAuth attempts with IP and user agent

---

### 2. Session Hijacking (Cookie Theft)

**Attack Vectors**:
- XSS attack extracts session cookie
- Network sniffing (man-in-the-middle)
- Malware on user device

**Mitigations**:
- ✅ **HttpOnly Cookie**: Prevent JavaScript access to session cookie
- ✅ **Secure Cookie**: Only transmit over HTTPS
- ✅ **SameSite=Strict**: Prevent cross-site cookie transmission
- ✅ **Short Expiration**: 24-hour session lifetime
- ✅ **TLS 1.3**: Encrypt all traffic

**Implementation**:
```typescript
res.cookie('session', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 86400000, // 24 hours
  path: '/'
});
```

**Additional Defenses**:
- IP address binding (optional, breaks mobile switching)
- User agent validation (detect cookie replay from different device)
- Anomaly detection (unusual access patterns)

---

### 3. Privilege Escalation

**Attack Scenarios**:
- User modifies role assignment request to grant `super_admin`
- Service token forged with elevated permissions
- Admin UI vulnerability allows unauthorized role grants

**Mitigations**:
- ✅ **Principle of Least Privilege**: Users granted minimum required permissions
- ✅ **Admin Separation**: Admin actions require explicit `manage:role` permission
- ✅ **Scope Validation**: Role assignments validated against actor's own scope
- ✅ **Audit Trail**: All role assignments logged with actor_id

**Implementation**:
```typescript
async function assignRole(request: RoleAssignmentRequest, actor: User): Promise<void> {
  // Check actor has manage:role permission
  const canManageRoles = await policyEngine.check({
    subject: `user:${actor.id}`,
    action: 'manage',
    resource: 'role',
    context: { tenant_id: request.tenant_id }
  });
  
  if (!canManageRoles.allow) {
    throw new ForbiddenError('Insufficient permissions to assign roles');
  }
  
  // Prevent granting roles outside actor's scope
  if (request.role_name === 'super_admin' && actor.roles.every(r => r.name !== 'super_admin')) {
    throw new ForbiddenError('Cannot grant super_admin role');
  }
  
  // Audit before granting
  await auditEvent({
    actor_id: actor.id,
    action: 'role.assign',
    resource: `user:${request.user_id}`,
    metadata: { role: request.role_name, tenant_id: request.tenant_id }
  });
  
  // Grant role
  await db.insert('role_assignments', request);
}
```

**Detection**:
- Alert on `super_admin` role grants
- Weekly review of role assignment changes
- Anomaly detection (unusual role patterns)

---

### 4. Token Forgery (JWT Attacks)

**Attack Scenarios**:
- Attacker obtains JWT secret and forges tokens
- Algorithm confusion attack (HS256 → none)
- Token replay attack (reuse expired token)

**Mitigations**:
- ✅ **Strong Secret**: 256-bit random JWT_SECRET from Secret Manager
- ✅ **Algorithm Enforcement**: Only allow HS256, reject `none` algorithm
- ✅ **Signature Verification**: Verify signature on every token validation
- ✅ **Expiration Check**: Reject expired tokens (1-hour lifetime)
- ✅ **Issuer/Audience Validation**: Verify `iss` and `aud` claims

**Implementation**:
```typescript
function verifyToken(token: string): TokenClaims {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'iam.maxai.com',
      audience: 'portal.maxai.com'
    });
    
    // Additional expiration check (defense in depth)
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token signature');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    throw error;
  }
}
```

**Key Rotation**:
```typescript
// Support multiple active keys for zero-downtime rotation
const ACTIVE_KEYS = [
  process.env.JWT_SECRET_CURRENT,
  process.env.JWT_SECRET_PREVIOUS
];

function verifyTokenWithRotation(token: string): TokenClaims {
  for (const key of ACTIVE_KEYS) {
    try {
      return jwt.verify(token, key, { algorithms: ['HS256'] });
    } catch (error) {
      continue; // Try next key
    }
  }
  throw new UnauthorizedError('Invalid token signature');
}
```

---

### 5. Brute Force Login Attacks

**Attack Flow**:
```
1. Attacker automates login attempts with credential list
2. OAuth consent screen bypassed if user previously authorized
3. Account lockout not enforced in OAuth flow
```

**Mitigations**:
- ✅ **Rate Limiting**: 10 login attempts per IP per minute
- ✅ **CAPTCHA** (future): Require CAPTCHA after 3 failed attempts
- ✅ **Account Lockout** (future): Temporarily lock account after 5 failed logins
- ✅ **Anomaly Detection**: Alert on unusual login patterns

**Implementation**:
```typescript
// Rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'rate_limit_exceeded',
        message: 'Too many login attempts, please try again later'
      }
    });
  }
});

app.get('/iam/auth/google', loginLimiter, handleGoogleAuth);
```

**Detection**:
```sql
-- Alert on >10 failed logins from single IP in 5 minutes
SELECT metadata->>'ip_address' AS ip, COUNT(*) AS failures
FROM audit
WHERE action = 'auth.login.failed'
  AND at > now() - interval '5 minutes'
GROUP BY metadata->>'ip_address'
HAVING COUNT(*) > 10;
```

---

### 6. SQL Injection

**Attack Vector**:
- Untrusted input in SQL queries
- Dynamic query construction without parameterization

**Mitigations**:
- ✅ **Parameterized Queries**: All queries use prepared statements
- ✅ **ORM/Query Builder**: TypeORM with automatic escaping
- ✅ **Input Validation**: Schema validation on all API inputs (class-validator)
- ✅ **Least Privilege DB User**: Service account has only necessary permissions

**Implementation**:
```typescript
// ❌ NEVER DO THIS (vulnerable to SQL injection)
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ ALWAYS USE PARAMETERIZED QUERIES
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);

// ✅ OR USE ORM
const user = await userRepository.findOne({ where: { email } });
```

**Database Permissions**:
```sql
-- IAM service account permissions
GRANT SELECT, INSERT ON users, tenants, clients TO iam_service;
GRANT INSERT ON audit TO iam_service;
REVOKE DELETE ON users, tenants, clients FROM iam_service;
REVOKE ALL ON pg_catalog.* FROM iam_service;
```

---

### 7. API Abuse (Resource Exhaustion)

**Attack Scenarios**:
- Policy check endpoint flooded with requests
- Token mint endpoint abused to exhaust service tokens
- Audit log query endpoint causes DB overload

**Mitigations**:
- ✅ **Rate Limiting**: Per-endpoint, per-token limits (see API Contracts doc)
- ✅ **Query Limits**: Max 1000 results per audit query
- ✅ **Timeout Enforcement**: 5-second query timeout
- ✅ **Circuit Breaker**: Auto-disable endpoints on overload

**Implementation**:
```typescript
// Rate limiter per endpoint
const policyCheckLimiter = rateLimit({
  windowMs: 60000,
  max: 1000,
  keyGenerator: (req) => req.headers.authorization, // Per service token
  skipSuccessfulRequests: false
});

app.post('/iam/policies/check', policyCheckLimiter, handlePolicyCheck);
```

**Circuit Breaker**:
```typescript
import CircuitBreaker from 'opossum';

const policyCheckBreaker = new CircuitBreaker(policyEngine.check, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

policyCheckBreaker.fallback(() => ({
  allow: false,
  reason: 'Service temporarily unavailable'
}));
```

---

## Security Controls Summary

### Authentication Controls

| Control | Implementation | Risk Mitigation |
|---------|----------------|-----------------|
| **OAuth 2.0 State Parameter** | Random 32-byte token, 5-min TTL | CSRF attacks |
| **Redirect URI Validation** | Whitelist of allowed URIs | Phishing, token theft |
| **Session Cookie Security** | HttpOnly, Secure, SameSite=Strict | XSS, MITM, CSRF |
| **Short Session Lifetime** | 24-hour expiration | Token replay, stolen sessions |
| **TLS 1.3** | All traffic encrypted | Eavesdropping, MITM |

### Authorization Controls

| Control | Implementation | Risk Mitigation |
|---------|----------------|-----------------|
| **Deny-by-Default** | Explicit permission required | Unauthorized access |
| **Scope Validation** | Enforce tenant/client boundaries | Cross-tenant access |
| **Role Assignment Audit** | Log all role grants with actor_id | Privilege escalation |
| **Policy Caching** | 5-minute TTL, invalidate on change | Performance vs freshness |
| **Admin Separation** | `manage:role` permission required | Unauthorized grants |

### Token Controls

| Control | Implementation | Risk Mitigation |
|---------|----------------|-----------------|
| **Strong JWT Secret** | 256-bit from Secret Manager | Token forgery |
| **Algorithm Enforcement** | Only HS256 allowed | Algorithm confusion |
| **Signature Verification** | Every token validated | Forged tokens |
| **Short Token Lifetime** | 1-hour service tokens | Token replay |
| **Key Rotation** | Multiple active keys | Zero-downtime rotation |

### Data Protection Controls

| Control | Implementation | Risk Mitigation |
|---------|----------------|-----------------|
| **Parameterized Queries** | All DB queries use $1, $2, ... | SQL injection |
| **Input Validation** | Schema validation (AJV, class-validator) | Injection attacks |
| **PII Redaction** | Automatic redaction in logs | Data leakage |
| **Audit Immutability** | Append-only table, DB triggers | Evidence tampering |
| **Encryption at Rest** | PostgreSQL TDE (transparent data encryption) | Data breach |

### Operational Controls

| Control | Implementation | Risk Mitigation |
|---------|----------------|-----------------|
| **Rate Limiting** | Per-endpoint, per-IP/token limits | Brute force, DoS |
| **Circuit Breaker** | Auto-disable on overload | Service degradation |
| **Least Privilege DB User** | Minimal permissions | Lateral movement |
| **Secret Management** | GCP Secret Manager | Credential exposure |
| **Security Monitoring** | Audit logs, metrics, alerts | Threat detection |

---

## Compliance Mappings

### HIPAA Security Rule

| Requirement | IAM Control | Evidence |
|-------------|-------------|----------|
| **§164.312(a)(1)** - Access Controls | RBAC with deny-by-default | Role assignments, policy checks |
| **§164.312(a)(2)(i)** - Unique User ID | User table with unique email | User records |
| **§164.312(b)** - Audit Controls | Comprehensive audit trail | Audit table, 2-year retention |
| **§164.312(c)(1)** - Integrity Controls | Append-only audit logs | DB triggers, immutability |
| **§164.312(d)** - Authentication | OAuth SSO, session management | Auth logs, session tokens |
| **§164.312(e)(1)** - Transmission Security | TLS 1.3, secure cookies | Network config, cookie attrs |

### SOC 2 Trust Services Criteria

| Criteria | IAM Control | Evidence |
|----------|-------------|----------|
| **CC6.1** - Logical Access Controls | RBAC, session management | Policy engine, auth flows |
| **CC6.2** - User Provisioning | SSO auto-provisioning, audit trail | User creation events |
| **CC6.3** - Access Review | Role assignment audit, reports | Monthly access reviews |
| **CC6.6** - Logical Access Monitoring | Failed login detection, alerts | Audit queries, metrics |
| **CC7.2** - System Monitoring | Comprehensive observability | Logs, metrics, traces |

---

## Security Testing

### Penetration Testing Scenarios

**Test 1: OAuth CSRF Attack**
```bash
# Attempt to bypass state parameter
curl 'https://api.maxai.com/iam/auth/google/callback?code=VALID_CODE&state=INVALID_STATE'
# Expected: 302 redirect to error page
```

**Test 2: Token Forgery**
```bash
# Forge token with none algorithm
token='eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyXzEyMyJ9.'
curl -H "Authorization: Bearer $token" https://api.maxai.com/iam/me
# Expected: 401 Unauthorized
```

**Test 3: SQL Injection**
```bash
# Attempt SQL injection in email field
curl -X POST https://api.maxai.com/iam/policies/check \
  -d '{"subject":"user:123","action":"read","resource":"client:' OR 1=1--"}'
# Expected: 422 Validation Error
```

**Test 4: Privilege Escalation**
```bash
# Agent user attempts to assign super_admin role
curl -X POST https://api.maxai.com/iam/roles/assign \
  -H "Authorization: Bearer AGENT_TOKEN" \
  -d '{"user_id":"user_456","role_name":"super_admin"}'
# Expected: 403 Forbidden
```

### Automated Security Scanning

**SAST (Static Analysis)**:
- Tool: SonarQube, Snyk Code
- Frequency: Every PR
- Checks: SQL injection, XSS, hardcoded secrets, crypto issues

**DAST (Dynamic Analysis)**:
- Tool: OWASP ZAP, Burp Suite
- Frequency: Weekly on staging
- Checks: Auth bypasses, injection, broken access control

**Dependency Scanning**:
- Tool: Snyk, Dependabot
- Frequency: Daily
- Checks: Known CVEs in dependencies

---

## Incident Response

### Detection

**Security Events Requiring Investigation**:
- Failed login rate > 10/min from single IP
- `super_admin` role assigned
- Policy check denied for admin actions
- Audit write failures (potential evidence tampering)
- Token signature verification failures

### Response Playbook

**Step 1: Detect and Alert**
```
PagerDuty alert: "High Failed Login Rate from IP 203.0.113.42"
```

**Step 2: Investigate**
```sql
-- Query failed login attempts
SELECT at, metadata->>'email' AS email, metadata->>'reason' AS reason
FROM audit
WHERE action = 'auth.login.failed'
  AND metadata->>'ip_address' = '203.0.113.42'
  AND at > now() - interval '1 hour'
ORDER BY at DESC;
```

**Step 3: Contain**
```bash
# Block IP at load balancer
gcloud compute firewall-rules create block-attacker \
  --action=DENY \
  --source-ranges=203.0.113.42/32 \
  --priority=1000
```

**Step 4: Eradicate**
```sql
-- Revoke all sessions from compromised account (if applicable)
DELETE FROM sessions WHERE user_id = 'compromised_user_123';
```

**Step 5: Recover**
```sql
-- Reset user password (if local auth)
-- Force re-authentication on next login
```

**Step 6: Post-Incident Review**
- Document timeline, impact, root cause
- Update detection rules, playbooks
- Implement additional mitigations

---

## Security Roadmap (Future Enhancements)

### Phase 2 (Post-MVP)
- ✅ Multi-factor authentication (MFA)
- ✅ CAPTCHA on login after failed attempts
- ✅ Password-based local authentication
- ✅ Account lockout policy

### Phase 3 (Advanced Security)
- ✅ Anomaly detection (ML-based)
- ✅ Geo-fencing (block logins from suspicious locations)
- ✅ Device fingerprinting
- ✅ Refresh tokens for long-lived sessions

### Continuous Improvement
- Quarterly penetration testing
- Annual SOC 2 Type II audit
- Security training for development team
- Bug bounty program (public launch)

---

## References

- [Overview](./overview.md) - Component architecture
- [Authentication](./authentication.md) - OAuth security controls
- [Authorization](./authorization.md) - RBAC security
- [Audit](./audit.md) - Security audit trail
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- ADR-0004: Policy Check Performance Budget
- ADR-0006: Audit Event Processing
