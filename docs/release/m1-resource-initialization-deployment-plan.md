# M1 Resource Initialization Deployment Plan

## Overview

This document outlines the deployment strategy for M1 milestone "Initialize Client Resources (Supabase KB)" with progressive rollout using feature flags, comprehensive monitoring, and rollback procedures.

## Deployment Scope

### Components Included
- **ResourceInitializationPlan execution** - Core Supabase table creation per client
- **Token proxy integration** - Secure Supabase key management in api-gateway  
- **Template deployment endpoints** - POST /templates/{id}/resources and /deploy
- **Resource registry** - Storage and tracking of provider links
- **Audit logging** - Full observability for resource operations

### Dependencies
- ✅ api-gateway service with token proxy (apps/api-gateway)
- ✅ Templates & Deployment service endpoints 
- ✅ IAM service for policy checks and audit
- ✅ Supabase Pro project provisioned
- ✅ Feature flags framework (alpha/beta gating)

## Feature Flag Strategy

### Flag Definition
```json
{
  "resource_initialization_m1": {
    "status": "alpha",
    "description": "Enable M1 Supabase resource initialization for client onboarding",
    "owner": "release_manager.rohan-patel",
    "environments": ["dev", "staging", "prod"],
    "expiry": "2025-12-31",
    "metadata": {
      "affects": ["POST /templates/{id}/resources", "POST /templates/{id}/deploy"],
      "dependencies": ["token_proxy_v1", "supabase_pro_tier"]
    }
  }
}
```

### Progressive Rollout Plan

#### Phase 1: Alpha (Internal Testing)
- **Duration**: 1 week
- **Scope**: Internal test clients only (max 5 clients)
- **Allowlist**: `tenant:maxai-internal, user:dev-team`
- **Success Criteria**: 
  - Zero failed resource initializations
  - All audit events properly logged
  - No secrets in logs (verified)
  - Performance within SLA (<5sec per ResourceInitializationPlan)

#### Phase 2: Beta (Limited Client Pilot) 
- **Duration**: 2 weeks
- **Scope**: Selected pilot clients (10-20 clients)
- **Allowlist**: `tenant:pilot-clients, user:early-adopters`
- **Success Criteria**:
  - 95% success rate on resource initialization
  - Zero security incidents
  - Supabase usage under 50% of quota limits
  - Client satisfaction scores >4.0/5.0

#### Phase 3: GA (General Availability)
- **Duration**: Ongoing
- **Scope**: All clients and tenants
- **Flag Status**: Promoted to GA (removed from gating)
- **Success Criteria**:
  - 99% success rate maintained
  - Auto-scaling and monitoring fully operational
  - Rollback procedures tested and documented

## Deployment Checklist

### Pre-Deployment (T-1 week)

#### Infrastructure Readiness
- [ ] **Supabase Pro project provisioned** and configured
- [ ] **Token proxy deployed** to staging and prod
- [ ] **Secrets manager configured** with Supabase keys
- [ ] **Feature flag service** operational in all environments
- [ ] **Monitoring dashboards** set up for resource operations
- [ ] **Alert rules configured** for failures and security events

#### Security Validation  
- [ ] **Security assessment passed** (per m1-token-proxy-security-assessment.md)
- [ ] **Secrets redaction tested** - no keys in logs
- [ ] **Cross-tenant isolation verified** - RLS policies working
- [ ] **Penetration testing completed** for token proxy endpoints
- [ ] **Compliance review passed** - audit logging meets requirements

#### Code Quality
- [ ] **All tests passing** - unit, integration, contract tests (≥95% coverage)
- [ ] **ESLint warnings resolved** - zero warnings policy enforced  
- [ ] **Contract validation working** - JSON schemas validate in CI
- [ ] **API documentation updated** - resource endpoints documented
- [ ] **Runbooks completed** - operational procedures documented

### Deployment Day (T-0)

#### Alpha Release (Morning)
```bash
# 1. Deploy services to production
kubectl apply -f k8s/api-gateway/
kubectl apply -f k8s/template-service/

# 2. Enable feature flag for alpha testing
curl -X POST /feature-flags \
  -d '{"flag":"resource_initialization_m1","status":"alpha","allowlist":["tenant:maxai-internal"]}'

# 3. Verify alpha deployment
curl -X POST /templates/test-template/resources -d '{"clientId":"test-client-001"}' 
# Should succeed for allowlisted users, 404/403 for others

# 4. Monitor initial metrics
kubectl logs -f deployment/api-gateway | grep "resource_initialization"
```

#### Health Checks (Every 2 hours)
- [ ] **Service health endpoints** returning 200 OK
- [ ] **Feature flag evaluation** working correctly (alpha users can access)
- [ ] **Database connections** stable and within limits
- [ ] **No error spikes** in application logs
- [ ] **Security alerts** clean (no unauthorized access attempts)

#### Success Criteria for Alpha
- [ ] All internal test clients successfully initialize resources
- [ ] Zero security incidents or secrets exposure
- [ ] Response times <5 seconds for resource initialization
- [ ] All audit events captured with correlation IDs

### Beta Rollout (T+1 week)

```bash
# Promote to beta with expanded allowlist
curl -X PUT /feature-flags/resource_initialization_m1 \
  -d '{"status":"beta","allowlist":["tenant:maxai-internal","tenant:pilot-clients"]}'

# Monitor beta metrics 
kubectl top pods | grep api-gateway
kubectl top pods | grep template-service
```

#### Beta Success Criteria
- [ ] 20+ pilot clients successfully onboarded
- [ ] Supabase usage <50% of Pro tier limits
- [ ] Zero data leaks or cross-tenant access
- [ ] Performance metrics within SLA
- [ ] Positive feedback from pilot clients

### GA Release (T+3 weeks)

```bash
# Promote to GA (remove feature flag gating)  
curl -X PUT /feature-flags/resource_initialization_m1 \
  -d '{"status":"GA"}'

# Verify GA deployment
curl -X POST /templates/production-template/resources -d '{"clientId":"prod-client-001"}'
# Should work for all authenticated users
```

## Monitoring and Alerting

### Critical Metrics

#### Business Metrics
- **Resource initialization success rate** (target: >99%)
- **Time to initialize resources** (target: <5 seconds)
- **Client onboarding completion rate** (target: >95%)
- **Cross-tenant isolation violations** (target: 0)

#### Technical Metrics  
- **API response times** for resource endpoints (P95 <3sec)
- **Database connection pool utilization** (<80%)
- **Supabase quota usage** (database: <80%, storage: <70%)
- **Token proxy authentication failures** (<0.1%)

#### Security Metrics
- **Secrets exposure incidents** (target: 0)
- **Unauthorized resource access attempts** (alert threshold: >5/hour)
- **Failed authentication attempts** (alert threshold: >10/minute)
- **Audit log completeness** (target: 100% of operations logged)

### Alert Configuration

#### P0 Alerts (Immediate Response)
```yaml
resource_initialization_failure_rate:
  condition: success_rate < 95% over 5 minutes
  notification: slack:#incidents, pager
  
secrets_in_logs_detected:
  condition: grep pattern matches "supabase.*key" in logs
  notification: slack:#security, pager
  
cross_tenant_access_violation:
  condition: client accessing wrong tenant resources
  notification: slack:#security, email
```

#### P1 Alerts (Response within 1 hour)
```yaml
supabase_quota_approaching:
  condition: database_usage > 80% OR storage_usage > 70%
  notification: slack:#ops
  
high_response_latency:
  condition: P95_latency > 5 seconds over 10 minutes
  notification: slack:#engineering
```

### Dashboards

#### Operations Dashboard
- Resource initialization success/failure rates over time
- Performance metrics (latency, throughput) by endpoint
- Supabase resource utilization trends
- Active client count and growth rate

#### Security Dashboard  
- Authentication and authorization success rates
- Audit log completeness and correlation ID coverage
- Security incident timeline and resolution status
- Access pattern anomalies and investigation status

#### Business Dashboard
- Client onboarding funnel metrics
- Feature flag adoption rates (alpha → beta → GA)
- Client satisfaction and support ticket trends
- Revenue impact of onboarding improvements

## Rollback Procedures

### Rollback Triggers
- **Success rate drops below 90%** for >10 minutes
- **Security incident detected** (secrets exposure, unauthorized access)
- **Supabase quota exceeded** causing service degradation
- **Cascading failures** affecting other services

### Automated Rollback (Circuit Breaker)
```bash
# Automatic feature flag disable if error rate >10%
if [ $(curl -s /metrics | grep error_rate | cut -d' ' -f2) > 0.10 ]; then
  curl -X PUT /feature-flags/resource_initialization_m1 \
    -d '{"status":"disabled"}'
  echo "AUTOMATED ROLLBACK: Feature flag disabled due to high error rate"
fi
```

### Manual Rollback Procedures

#### Level 1: Feature Flag Rollback (5 minutes)
```bash
# Immediately disable feature flag
curl -X PUT /feature-flags/resource_initialization_m1 \
  -d '{"status":"disabled","reason":"manual_rollback_$(date +%Y%m%d_%H%M%S)"}'

# Verify rollback - new resource requests should get 404/feature disabled
curl -X POST /templates/test/resources && echo "ROLLBACK FAILED" || echo "ROLLBACK SUCCESS"
```

#### Level 2: Service Rollback (15 minutes)  
```bash
# Rollback to previous service version
kubectl rollout undo deployment/api-gateway
kubectl rollout undo deployment/template-service

# Wait for rollout to complete
kubectl rollout status deployment/api-gateway --timeout=300s
kubectl rollout status deployment/template-service --timeout=300s

# Verify services healthy
kubectl get pods | grep -E "(api-gateway|template-service)"
```

#### Level 3: Database Rollback (30 minutes)
```bash
# If resource initialization created bad state, rollback affected clients
# (This should rarely be needed due to idempotent operations)

# 1. Identify affected clients from audit logs
kubectl logs deployment/api-gateway | grep "resource_initialization" | grep "ERROR"

# 2. Rollback specific client resources (manual intervention)
# Note: This requires careful analysis and should involve DBA

# 3. Verify data consistency
# Run validation queries to ensure tenant isolation intact
```

### Post-Rollback Procedures

#### Immediate (Within 1 hour)
- [ ] **Incident response initiated** - create incident ticket
- [ ] **Stakeholder notification** - inform team leads and affected clients
- [ ] **Data integrity check** - verify no corrupted client resources
- [ ] **Security audit** - confirm no secrets exposed during incident

#### Short-term (Within 24 hours)  
- [ ] **Root cause analysis** - identify what triggered rollback
- [ ] **Fix development** - address underlying issue
- [ ] **Testing plan** - validate fix in staging environment
- [ ] **Communication plan** - client communications and timing

#### Long-term (Within 1 week)
- [ ] **Post-mortem document** - lessons learned and process improvements
- [ ] **Monitoring improvements** - add alerts to prevent similar issues
- [ ] **Rollback procedure updates** - refine based on experience
- [ ] **Team training** - share learnings with engineering team

## Risk Mitigation

### High-Risk Scenarios

#### Scenario: Mass Resource Initialization Failure
- **Probability**: Medium  
- **Impact**: High (blocks client onboarding)
- **Mitigation**: Circuit breaker + automatic feature flag disable
- **Recovery**: Service rollback + manual resource cleanup

#### Scenario: Secrets Exposed in Logs
- **Probability**: Low
- **Impact**: Critical (security incident)  
- **Mitigation**: Comprehensive log redaction testing pre-deployment
- **Recovery**: Immediate key rotation + incident response

#### Scenario: Cross-Tenant Data Access
- **Probability**: Low
- **Impact**: Critical (data breach)
- **Mitigation**: RLS policy testing + comprehensive audit logging
- **Recovery**: Immediate service shutdown + security investigation

### Success Metrics

#### Technical Success
- 99%+ resource initialization success rate
- <5 second average response time
- Zero security incidents
- 100% audit log coverage

#### Business Success  
- 20% reduction in client onboarding time
- 95%+ client satisfaction with onboarding
- Zero escalated support tickets related to resource initialization
- Successful foundation for M2 milestone features

## Communication Plan

### Internal Updates
- **Daily standups** during alpha/beta phases
- **Weekly release reports** to stakeholders  
- **Incident notifications** via Slack #incidents channel
- **Success metrics** shared in team all-hands

### Client Communications
- **Alpha/Beta invitations** with clear expectations
- **Feature availability announcements** when promoted to GA
- **Maintenance notifications** for any service windows
- **Success story sharing** to drive adoption

## Sign-off Requirements

Release Manager approves deployment when:
- [ ] All pre-deployment checklist items completed
- [ ] Security assessment passed with no high-risk findings
- [ ] Feature flag system operational and tested  
- [ ] Monitoring and alerting fully configured
- [ ] Rollback procedures tested in staging environment
- [ ] Team trained on operational procedures
- [ ] Client communication plan approved
- [ ] Incident response plan updated and ready

---

**Deployment Authorization**: Release Manager signature required before production deployment.

**Emergency Contact**: Release Manager on-call rotation for M1 resource initialization issues.