# GHL Token Investigation Plan (ARCH-14 Extension)

**Status**: Ready for Execution  
**Priority**: HIGH  
**Related Issue**: [ARCH-14 — GHL Limitations and Standalone Feasibility Assessment](https://github.com/raming/max-ai-platform/issues/14)

## Background

The GHL feasibility assessment identified **token management as a HIGH RISK** factor due to:
- All existing tokens expired/invalid (401 errors across all endpoints)
- Token management complexity significantly underestimated
- Manual token refresh requirements blocking API validation

## Investigation Approach

### Reverse Engineering Strategy

Instead of relying on potentially incomplete API documentation, we will **reverse-engineer GHL's actual token refresh mechanisms** by monitoring live browser sessions.

### Tools Developed

**Location**: `/ops/tools/ghl-token-investigation/`

1. **Token Investigation Script** (`investigate-tokens.js`)
   - Puppeteer-based headless browser automation
   - Intercepts ALL network traffic during GHL login/usage
   - Captures token structures, refresh endpoints, timing patterns
   - Monitors localStorage/sessionStorage changes

2. **Analysis Engine** (`analyze-tokens.js`) 
   - Processes captured network data
   - Identifies token types, lifetimes, refresh patterns
   - Generates architectural recommendations
   - Creates implementation roadmap

## Investigation Protocol

### Phase 1: Network Traffic Capture
**Duration**: 30-60 minutes  
**Requirements**: Valid GHL admin credentials

1. Launch investigation script: `npm run investigate`
2. Manually complete GHL login process  
3. Navigate through different GHL sections
4. Wait for potential automatic token refresh events
5. Trigger various API operations
6. Monitor network logs in real-time

### Phase 2: Pattern Analysis  
**Duration**: 15-30 minutes

1. Process captured data: `npm run analyze <results-file>`
2. Generate detailed analysis reports
3. Extract token refresh mechanisms
4. Identify implementation strategies

## Expected Discoveries

### Token Architecture Discovery
- **Token Types**: Admin vs sub-account vs session tokens
- **Storage Mechanisms**: Cookies, localStorage, sessionStorage, memory
- **JWT Structure**: Claims, expiry patterns, refresh cycles
- **Scope & Permissions**: API coverage per token type

### Refresh Mechanism Analysis
- **Automatic Refresh**: Background token renewal patterns
- **Refresh Endpoints**: Dedicated token refresh APIs
- **Session Management**: Browser session extension mechanisms  
- **Fallback Procedures**: Manual re-authentication triggers

### Timing & Lifecycle Patterns
- **Token Lifetimes**: Typical expiry durations
- **Refresh Windows**: Optimal refresh timing (e.g., 80% of lifetime)
- **Rate Limits**: Refresh frequency constraints
- **Error Handling**: Token refresh failure scenarios

## Implementation Strategy Options

### Option 1: Programmatic Refresh (Preferred)
**If investigation reveals refresh token support:**
- Implement OAuth2-style refresh token rotation
- Build token proxy with automatic refresh capabilities
- Health monitoring with failure alerting
- Exponential backoff for failed refresh attempts

### Option 2: Session Extension
**If investigation reveals session-based refresh:**
- Monitor session expiry patterns
- Implement session keep-alive mechanisms  
- Background session extension API calls
- Session health monitoring

### Option 3: Fallback Re-authentication  
**If no automatic refresh is available:**
- Monitor token health (401 error detection)
- Implement graceful re-authentication flow
- User notification system for manual intervention
- Enhanced error handling and recovery

## Risk Mitigation

### Investigation Risks
- **Login Failures**: Use sandbox account for testing
- **Rate Limiting**: Implement respectful request patterns
- **Detection Avoidance**: Use realistic browser simulation
- **Data Security**: All tokens sanitized/redacted in logs

### Implementation Risks  
- **Token Complexity**: Multiple token types requiring different strategies
- **Reliability**: Refresh mechanisms may be undocumented/unstable
- **Maintenance**: Changes to GHL auth flow requiring updates

## Success Criteria

### Investigation Success
✅ **Network Traffic Captured**: Auth-related requests/responses logged  
✅ **Token Structure Decoded**: JWT claims and expiry patterns identified  
✅ **Refresh Mechanism Found**: Automatic or manual refresh approach discovered  
✅ **Architectural Plan Created**: Clear implementation strategy defined

### Implementation Success  
✅ **99% Token Uptime**: Automated refresh maintains valid tokens  
✅ **Graceful Failures**: Failed refresh handled without service interruption  
✅ **Health Monitoring**: Token expiry alerts and dashboard visibility  
✅ **Documentation Complete**: Token management runbooks created

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Investigation** | Day 1 (2-3 hours) | Network capture + analysis reports |
| **Architecture Design** | Day 2 (4-6 hours) | Token proxy service design |
| **Implementation Plan** | Day 3 (2-3 hours) | Development task breakdown |
| **Assessment Update** | Day 3 (1 hour) | Updated risk assessment + decision framework |

## Next Actions

### Immediate (Ready to Execute)
1. **Run Investigation**: Execute token capture using developed tools
2. **Analyze Results**: Process network data for patterns  
3. **Update Assessment**: Incorporate findings into ARCH-14

### Following Investigation
4. **Design Token Proxy**: Create enhanced architecture based on findings
5. **Create Development Tasks**: Break down implementation for Team Lead
6. **Update Phase 1 Plan**: Adjust priorities based on token complexity

## Coordination

- **Architect**: Leads investigation and analysis (this work)
- **Human User**: Provides GHL credentials and performs manual login  
- **Team Lead**: Receives implementation tasks post-investigation
- **Release Manager**: Coordinates with token proxy deployment

---

**Status Update for Issue #14**: Investigation tools ready for execution. Awaiting human coordination for live GHL session to capture token refresh mechanisms.