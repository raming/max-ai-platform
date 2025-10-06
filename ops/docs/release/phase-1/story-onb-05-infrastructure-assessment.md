# STORY-ONB-05 Infrastructure Prerequisites Assessment

**Release Manager**: release_manager.rohan-patel  
**Assessment Date**: 2025-10-06  
**Story**: [#19](https://github.com/raming/max-ai-platform/issues/19) STORY-ONB-05 — Portal Connect Accounts Wizard  

## Executive Summary

**STATUS: 🔴 CRITICAL - BLOCKING DEVELOPMENT**

All infrastructure prerequisites for Connect Accounts Wizard are currently missing and must be completed before development can proceed. OAuth application registrations and token vault setup are critical path items blocking both frontend and backend development teams.

## Detailed Assessment

### 1. OAuth Application Registrations
**Status**: 🔴 NOT STARTED - HIGH PRIORITY  
**Impact**: Blocks development work on issues #65 and #66  
**Timeline Required**: 5-10 business days (approval processes)

#### Google OAuth Application
- **Status**: ❌ Not Created
- **Required APIs**: Google Calendar API, Google Business Profile API
- **Setup Location**: Google Cloud Console
- **Approval Process**: Standard OAuth verification (3-7 business days)
- **Redirect URIs Needed**:
  - `https://dev.maxai-platform.com/api/auth/oauth/google/callback`
  - `https://staging.maxai-platform.com/api/auth/oauth/google/callback`  
  - `https://app.maxai-platform.com/api/auth/oauth/google/callback`
- **Scopes Required**: 
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/calendar.events`
  - `https://www.googleapis.com/auth/business.manage`

#### Microsoft OAuth Application  
- **Status**: ❌ Not Created
- **Required APIs**: Microsoft Graph API
- **Setup Location**: Azure App Registrations
- **Approval Process**: Standard app registration (1-3 business days)
- **Redirect URIs Needed**: Same pattern as Google
- **Scopes Required**:
  - `https://graph.microsoft.com/calendars.readwrite`
  - `https://graph.microsoft.com/mail.read`
  - `https://graph.microsoft.com/offline_access`

#### GHL OAuth Proxy
- **Status**: 🟡 EXISTING - NEEDS VALIDATION  
- **Note**: Team Lead mentioned existing GHL OAuth proxy architecture
- **Required**: Validation of current implementation and extension for new use cases
- **Location IDs**: Need test location configurations

### 2. Token Vault Service Architecture
**Status**: 🔴 NOT IMPLEMENTED - HIGH PRIORITY  
**Impact**: Blocks secure token storage required for production deployment  
**Timeline Required**: 2-3 weeks (design + implementation)

#### Core Requirements
- **Encryption at Rest**: AES-256 encryption for all stored tokens
- **Tenant Isolation**: Multi-tenant token separation by organization
- **Automatic Refresh**: Background job for token refresh before expiration  
- **Access Auditing**: Complete audit trail of token access and modifications
- **Rotation Policy**: Configurable token rotation schedules

#### Integration Points
- **Secret Manager**: Google Secret Manager or equivalent secure storage
- **Database**: Encrypted metadata storage with foreign key references
- **Background Jobs**: Token refresh scheduling and execution
- **API Gateway**: Secure token retrieval for provider API calls
- **Monitoring**: Health checks and failure alerting

#### Security Considerations
- **Zero Client Exposure**: Tokens never sent to browser/client applications
- **Memory Safety**: No plaintext tokens in application memory or logs
- **Network Security**: TLS encryption for all token vault communications
- **Access Control**: RBAC for token vault operations

### 3. Provider Sandbox Accounts
**Status**: 🔴 NOT STARTED - MEDIUM PRIORITY  
**Impact**: Limits testing capabilities, but development can proceed with mocks  
**Timeline Required**: 1-2 weeks (account setup processes)

#### Account Requirements
- **Google Workspace**: Developer workspace for testing calendar integrations
- **Microsoft 365**: Developer tenant for Graph API testing
- **Retell API**: Sandbox account with test agent configurations  
- **Twilio**: Development account with test phone numbers
- **GHL**: Test location with sandbox data for proxy testing

#### Testing Data Needs
- **Sample Calendar Events**: Google/Microsoft calendar test data
- **Test Phone Numbers**: Twilio sandbox numbers for SMS/voice testing
- **Mock Agents**: Retell AI agent configurations for connection testing
- **GHL Test Location**: Sample contacts, appointments, workflows

### 4. Development Environment Setup
**Status**: 🟡 PARTIAL - NEEDS VALIDATION  
**Impact**: May require environment configuration updates  

#### Required Environment Variables
```bash
# OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=<from_google_console>
GOOGLE_OAUTH_CLIENT_SECRET=<from_google_console>
MICROSOFT_OAUTH_CLIENT_ID=<from_azure_portal>
MICROSOFT_OAUTH_CLIENT_SECRET=<from_azure_portal>

# Provider API Keys (Development)
RETELL_API_KEY=<sandbox_key>
TWILIO_ACCOUNT_SID=<sandbox_sid>
TWILIO_AUTH_TOKEN=<sandbox_token>

# Token Vault Service
TOKEN_VAULT_URL=<vault_service_endpoint>
TOKEN_VAULT_ENCRYPTION_KEY=<encryption_key>

# GHL Proxy Configuration
GHL_PROXY_URL=<existing_proxy_endpoint>
GHL_PROXY_API_KEY=<proxy_api_key>
```

## Risk Analysis

### Critical Path Risks
1. **Google OAuth Approval Delays**: Google's OAuth verification process can take 7+ days
   - **Mitigation**: Submit application immediately with all required documentation
   - **Contingency**: Implement mock OAuth flows for initial development

2. **Token Vault Architecture Complexity**: Secure implementation requires careful design
   - **Mitigation**: Leverage existing patterns from GHL proxy implementation
   - **Contingency**: Start with simplified encryption, enhance iteratively

3. **Multi-Provider Integration Timing**: Different providers have different setup timelines
   - **Mitigation**: Parallelize provider setups, prioritize by complexity
   - **Contingency**: Phase rollout starting with easiest providers (Retell, Twilio)

### Dependency Risks
1. **Development Team Blocking**: UI and API development cannot proceed without OAuth apps
   - **Impact**: Could delay entire M1 milestone delivery
   - **Resolution**: Prioritize OAuth application creation this week

2. **Security Review Delays**: Token vault implementation may require security review
   - **Impact**: Could block production deployment approval
   - **Resolution**: Engage security team early in design phase

## Immediate Action Plan

### This Week (Week of Oct 6, 2025)
1. **URGENT - OAuth Applications**:
   - Google Cloud Console: Create project, enable APIs, setup OAuth consent
   - Azure Portal: Create app registration, configure API permissions
   - Submit for verification/approval processes

2. **Token Vault Design**: 
   - Document architecture requirements and security controls
   - Review existing GHL proxy patterns for reusability
   - Design multi-tenant encryption and access control

3. **Provider Outreach**:
   - Request Retell sandbox account and API documentation
   - Setup Twilio development account with test numbers
   - Validate GHL test location access and data

### Next Week (Week of Oct 13, 2025)  
1. **Infrastructure Validation**:
   - Test OAuth applications in development environment
   - Implement basic token vault service
   - Validate provider sandbox account access

2. **Development Enablement**:
   - Provide OAuth credentials to development team
   - Setup development environment configurations
   - Create provider API testing framework

## Success Criteria

### Week 1 Completion
- [ ] Google OAuth application created and submitted for verification
- [ ] Microsoft OAuth application created and configured  
- [ ] Token vault architecture designed and approved by security team
- [ ] Provider sandbox accounts requested and setup initiated

### Week 2 Completion  
- [ ] OAuth applications approved and tested in development
- [ ] Token vault service implemented and tested
- [ ] Provider sandbox accounts operational with test data
- [ ] Development team unblocked and actively working on issues #65, #66

## Escalation Points

### Immediate Escalation Required
- **OAuth Approval Delays**: If Google/Microsoft approval takes >7 days
- **Token Vault Design Conflicts**: If security requirements conflict with timeline
- **Provider Account Blocks**: If any provider denies sandbox access

### Escalation Contacts
- **Platform Team**: Infrastructure and OAuth setup support
- **Security Team**: Token vault architecture and compliance review
- **Development Team**: Requirements clarification and testing support

---

**Next Review**: End of Week (Oct 11, 2025) - Infrastructure status checkpoint  
**Critical Decision Point**: Go/No-go for development team work beginning Week 2

*Assessment completed by release_manager.rohan-patel on 2025-10-06*