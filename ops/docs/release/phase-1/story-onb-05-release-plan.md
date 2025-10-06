# STORY-ONB-05 — Connect Accounts Wizard Release Plan

**Release Manager**: release_manager.rohan-patel  
**Story**: [#19](https://github.com/raming/max-ai-platform/issues/19) STORY-ONB-05 — Portal Connect Accounts Wizard  
**Phase**: Phase 1 — M1: Onboarding Foundations  
**Priority**: P0 (Critical Path)  
**Target Release**: M1 Milestone  

## Executive Summary

The Connect Accounts Wizard is a critical M1 deliverable enabling secure OAuth and credential-based provider integrations (Google, Microsoft, GHL, Retell, Twilio). This release plan addresses infrastructure prerequisites, security validation, and deployment coordination for a multi-week development cycle.

## Development Tasks Overview

| Task | Assignee | Type | Dependencies | Status |
|------|----------|------|-------------|---------|
| [#65](https://github.com/raming/max-ai-platform/issues/65) DEV-CON-01 | `seat:dev.avery-kim` | UI Components | Design system, API specs | ⏳ Ready |
| [#66](https://github.com/raming/max-ai-platform/issues/66) DEV-CON-02 | `seat:dev.avery-kim` | OAuth/API Services | Vault setup, OAuth apps | ⏳ Ready |  
| [#68](https://github.com/raming/max-ai-platform/issues/68) QA-CON-01 | `seat:qa.default` | Security/Integration Testing | Dev completion | ⏳ Waiting |

## Infrastructure Prerequisites

### OAuth Application Registrations
**Status**: 🔴 REQUIRED - Not Started
- [ ] **Google OAuth App**: Google Cloud Console setup for Calendar + Business Profile APIs
- [ ] **Microsoft OAuth App**: Azure App Registration for Graph API access  
- [ ] **GHL OAuth Proxy**: Leverage existing GHL OAuth proxy architecture
- [ ] **OAuth Consent Screens**: User-facing consent flows configured
- [ ] **Redirect URIs**: Allowlisted callback URLs for all environments

**Owner**: Release Manager + Platform Team  
**Timeline**: Week 1 (blocking development)  
**Risk**: HIGH - Development cannot proceed without OAuth apps

### Token Vault Configuration
**Status**: 🔴 REQUIRED - Not Started  
- [ ] **Secret Manager Integration**: Encrypted token storage service
- [ ] **Tenant Isolation**: Multi-tenant token separation
- [ ] **Automatic Token Refresh**: Background refresh job configuration
- [ ] **Token Rotation**: Security policy implementation
- [ ] **Access Auditing**: Token access logging setup

**Owner**: Release Manager + Security Team  
**Timeline**: Week 1-2 (parallel with OAuth setup)  
**Risk**: HIGH - Security requirement for production deployment

### Provider Sandbox Accounts
**Status**: 🔴 REQUIRED - Not Started
- [ ] **Google Workspace**: Development/testing workspace
- [ ] **Microsoft 365**: Developer tenant for Graph API testing  
- [ ] **Retell API**: Sandbox account with test agent configurations
- [ ] **Twilio**: Development account with test phone numbers
- [ ] **GHL**: Test location with sandbox data

**Owner**: Release Manager + Development Team  
**Timeline**: Week 1 (enables testing)  
**Risk**: MEDIUM - Testing limited without sandbox accounts

## Security Architecture

### Enterprise Security Controls
- **Zero Token Exposure**: No credentials sent to client browser
- **OAuth State Encryption**: Tenant-specific encryption with CSRF protection  
- **PKCE Implementation**: Proof Key for Code Exchange where supported
- **Automatic Token Refresh**: Background refresh with 50-minute cycles
- **Secure Vault Storage**: Encrypted token storage with access auditing

### Security Validation Requirements
- [ ] **Penetration Testing**: OAuth flows and credential handling
- [ ] **Token Security Audit**: Encryption, storage, and rotation validation
- [ ] **Input Validation Testing**: SQL injection, XSS prevention
- [ ] **Rate Limiting Validation**: Provider API compliance testing
- [ ] **RBAC Implementation**: Tenant isolation and access controls

**Owner**: QA Team + Security Team  
**Timeline**: Week 3-4 (parallel with development)  
**Risk**: HIGH - Security gate for production release

## Deployment Strategy

### Environment Progression
1. **Development**: Local OAuth apps, mock provider responses
2. **Staging**: Real provider sandboxes, encrypted token vault  
3. **Production**: Production OAuth apps, full security controls

### Rollout Phases
- **Phase 1**: UI components + mock integrations (Week 2)
- **Phase 2**: OAuth proxy + real provider connections (Week 3)  
- **Phase 3**: Security hardening + comprehensive testing (Week 4)
- **Phase 4**: Production deployment + monitoring (Week 4-5)

### Feature Flags
```typescript
// Proposed feature flag strategy
const connectAccountsFlags = {
  enableOAuthGoogle: false,      // Week 2
  enableOAuthMicrosoft: false,   // Week 2  
  enableGHLProxy: false,         // Week 3
  enableRetellAPI: false,        // Week 3
  enableTwilioAPI: false,        // Week 3
  enableProductionMode: false    // Week 4
};
```

## Quality Gates

### Development Completion Criteria
- [ ] **ESLint Clean**: `--max-warnings 0` enforcement
- [ ] **Type Safety**: Zero TypeScript errors
- [ ] **Test Coverage**: ≥95% line/branch coverage for all components
- [ ] **Contract Tests**: Provider API integration validation
- [ ] **Unit Tests**: React component testing with React Testing Library
- [ ] **Integration Tests**: E2E OAuth flows with Playwright

### Release Readiness Criteria  
- [ ] **Security Approval**: Penetration testing completed, vulnerabilities resolved
- [ ] **Performance Validation**: OAuth flow latency <3 seconds P95
- [ ] **Accessibility Compliance**: WCAG 2.1 AA validation passed
- [ ] **Provider Testing**: All 5 providers connectable in staging
- [ ] **Error Handling**: Comprehensive error scenarios tested
- [ ] **Documentation**: User guides and troubleshooting docs ready

## Risk Management

### High-Risk Items
1. **OAuth App Setup Delays**: Complex approval processes with Google/Microsoft
   - **Mitigation**: Start immediately, escalate if blocked
   - **Contingency**: Mock OAuth flows for initial development

2. **Token Vault Security Implementation**: Complex encryption and rotation
   - **Mitigation**: Leverage existing GHL proxy patterns
   - **Contingency**: Simplified encryption for M1, enhanced for M2

3. **Provider API Rate Limiting**: Unexpected rate limit restrictions  
   - **Mitigation**: Circuit breaker patterns, exponential backoff
   - **Contingency**: Graceful degradation, user notification

4. **Cross-Provider Integration Complexity**: Different OAuth patterns
   - **Mitigation**: Unified OAuth proxy abstraction layer
   - **Contingency**: Phase rollout by provider complexity

### Medium-Risk Items
1. **Development Resource Availability**: Single dev assigned to large scope
   - **Mitigation**: Parallel UI/API development where possible
   - **Contingency**: Reduce M1 scope, defer non-critical providers

2. **Testing Environment Setup**: Sandbox account procurement delays
   - **Mitigation**: Start provider outreach early
   - **Contingency**: Mock responses for initial testing

## Timeline & Dependencies

### Week 1: Foundation Setup
- **Release Manager**: OAuth app registrations, vault setup
- **Development**: Project setup, design system integration
- **Blockers**: OAuth applications must be approved

### Week 2: Core Development  
- **Frontend**: Provider connection components (#65)
- **Backend**: OAuth proxy service foundation (#66)
- **Dependencies**: Design system components, API specifications

### Week 3: Integration & Security
- **Backend**: Provider API integrations, security hardening
- **QA**: Security testing, OAuth flow validation (#68)
- **Dependencies**: Real provider sandbox accounts

### Week 4: Testing & Validation
- **QA**: Comprehensive testing, performance validation
- **Release Manager**: Production deployment preparation
- **Dependencies**: Security approval, performance benchmarks

### Week 5: Production Deployment
- **Release Manager**: Coordinated rollout, monitoring setup
- **Support**: Documentation, troubleshooting guides
- **Dependencies**: All quality gates passed

## Success Metrics

### M1 Delivery Criteria
- [ ] **Functional**: All 5 providers (Google, Microsoft, GHL, Retell, Twilio) connectable
- [ ] **Performance**: OAuth flows complete in <3 seconds with proper error handling  
- [ ] **Persistence**: Connection status persists across browser sessions
- [ ] **Security**: Zero security vulnerabilities in penetration testing
- [ ] **Accessibility**: WCAG 2.1 AA compliance validated
- [ ] **Reliability**: 99.9% connection success rate in testing

### Monitoring & Observability
- **Connection Success Rates**: Per-provider success/failure tracking
- **OAuth Flow Latency**: P50, P95, P99 response times
- **Token Refresh Health**: Automatic refresh success rates  
- **Error Rate Monitoring**: Provider-specific error thresholds
- **Security Event Tracking**: Authentication failures, suspicious activity

## Next Actions

### Immediate (This Week)
1. **OAuth Application Registration**: Start Google/Microsoft application approval process
2. **Token Vault Architecture**: Design secure token storage with encryption
3. **Provider Sandbox Setup**: Initiate sandbox account requests
4. **Development Kickoff**: Coordinate with `seat:dev.avery-kim` on task prioritization

### Short-term (Week 2)
1. **Infrastructure Validation**: Test OAuth apps and vault in development  
2. **Development Progress**: Monitor UI component development (#65)
3. **Security Planning**: Coordinate penetration testing scope with security team
4. **QA Preparation**: Prepare test environments and data for comprehensive testing

---

**Release Manager Notes**:
- OAuth consent screens and token proxy storage are primary release concerns
- Security controls and secrets rotation are built into the architecture
- Infrastructure coordination is critical path - development blocked without OAuth apps
- Multi-provider complexity requires careful phased rollout strategy

*Document prepared by release_manager.rohan-patel on 2025-10-06*