# GHL Token Management Architecture (Complete Flow)

**Status**: Final Design Based on Live Investigation  
**Related**: [ARCH-14 — GHL Token Investigation](https://github.com/raming/max-ai-platform/issues/14)

## Problem Statement

GHL requires **human-in-the-loop authentication** (credentials + 2FA) but tokens expire every **1 hour**. We need a system that:

1. **Handles Initial Authentication** (manual, one-time)
2. **Maintains Tokens Automatically** (automated, ongoing)
3. **Recovers from Failures** (graceful fallback)

## Discovered Token Flow

### 🔍 **Investigation Findings**

From live network capture, we confirmed:

**Token Types**:
- **Session JWT**: `eyJhbGciOiJSU...` (main user token)
- **API JWT**: `eyJhbGciOiJIU...` (API-specific operations)  
- **Workflow Token**: `53782ca3-33fb...` (automation system)

**Token Lifetime**: **3600 seconds (1 hour)**
```
JWT decoded: exp=1759711797, iat=1759708197  (1 hour lifetime)
```

**Refresh Endpoint**: 
```
POST https://backend.leadconnectorhq.com/oauth/2/login/signin/refresh?version=2&location_id={locationIds}
```

**Multi-Location Support**: 
```
location_id=3MF7Qje6BuQlkuO9gSs5,yrMl7UtmMqo31qLMP76W
```

## 🏗️ **Architecture Design**

### Adapter/Abstraction Strategy (Ports & Adapters)

To ensure we can switch from the current admin-user token seeding approach to an agency API key approach without impacting the broader application, we define a dedicated port and pluggable adapters:

- Port: IGHLAuthPort (see ports-and-adapters.md)
- Adapters:
  - AdminUserSeedAuthAdapter — current strategy; seeds from admin user session and maintains tokens via refresh endpoint
  - AgencyApiKeyAuthAdapter — future strategy; derives scoped access using agency API key when available/supported

All consumers (API gateway, proxy services, webhooks) depend only on IGHLAuthPort. The concrete adapter is injected via configuration/DI per environment/tenant. Contract validation is enforced in CI and non-prod runtime.

### **Component 1: Initial Authentication Service**

**Purpose**: Handle one-time human authentication to acquire initial tokens

```typescript
interface InitialAuthService {
  // Method 1: Manual Browser Flow (Recommended)
  async authenticateViaBrowser(): Promise<TokenSet> {
    // 1. Launch controlled browser session
    // 2. Navigate to GHL login 
    // 3. Wait for human to complete login + 2FA
    // 4. Extract tokens from successful login
    // 5. Store securely in token vault
  }
  
  // Method 2: Programmatic Login (If Possible)
  async authenticateViaAPI(credentials: GHLCredentials): Promise<TokenSet> {
    // 1. POST /oauth/2/login/email with credentials
    // 2. Handle 2FA challenge (may require human intervention)
    // 3. Complete authentication flow
    // 4. Extract and store tokens
  }
}

interface GHLCredentials {
  email: string;
  password: string; // Stored securely in Secret Manager
  totpSecret?: string; // If 2FA can be automated via TOTP
}

interface TokenSet {
  sessionToken: string;    // Main JWT for user operations
  apiToken: string;        // API-specific JWT  
  workflowToken: string;   // Automation/workflow token
  locationIds: string[];   // Associated location IDs
  expiresAt: Date;         // Token expiry time
  refreshToken?: string;   // If available for refresh
}
```

### **Component 2: Token Refresh Service**

**Purpose**: Automatically refresh tokens before expiry

```typescript
interface TokenRefreshService {
  // Core refresh logic (confirmed working)
  async refreshTokens(currentTokens: TokenSet): Promise<TokenSet> {
    const locationIdParam = currentTokens.locationIds.join(',');
    
    const response = await fetch(
      `https://backend.leadconnectorhq.com/oauth/2/login/signin/refresh?version=2&location_id=${locationIdParam}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentTokens.sessionToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200) {
      const refreshedData = await response.json();
      return this.parseTokenResponse(refreshedData);
    }
    
    throw new TokenRefreshError('Failed to refresh tokens', response.status);
  }
  
  // Automatic refresh scheduler
  async startRefreshScheduler(tokenSet: TokenSet): Promise<void> {
    const refreshInterval = 50 * 60 * 1000; // 50 minutes (83% of 1 hour)
    
    setInterval(async () => {
      try {
        const refreshedTokens = await this.refreshTokens(tokenSet);
        await this.updateTokenStorage(refreshedTokens);
        console.log('✅ Tokens refreshed successfully');
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        await this.handleRefreshFailure(error);
      }
    }, refreshInterval);
  }
}
```

### **Component 3: Token Storage & Health Monitoring**

**Purpose**: Secure token storage with health monitoring

```typescript
interface TokenVault {
  // Secure storage (Google Secret Manager)
  async storeTokens(tokens: TokenSet): Promise<void>;
  async retrieveTokens(): Promise<TokenSet>;
  async updateTokens(tokens: TokenSet): Promise<void>;
  
  // Health monitoring
  async checkTokenHealth(): Promise<TokenHealthStatus> {
    const tokens = await this.retrieveTokens();
    const timeToExpiry = tokens.expiresAt.getTime() - Date.now();
    
    if (timeToExpiry < 5 * 60 * 1000) { // Less than 5 minutes
      return TokenHealthStatus.CRITICAL;
    } else if (timeToExpiry < 10 * 60 * 1000) { // Less than 10 minutes  
      return TokenHealthStatus.WARNING;
    }
    
    return TokenHealthStatus.HEALTHY;
  }
}

enum TokenHealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning', 
  CRITICAL = 'critical',
  EXPIRED = 'expired'
}
```

### **Component 4: Fallback & Recovery**

**Purpose**: Handle authentication failures gracefully

```typescript
interface FallbackManager {
  async handleRefreshFailure(error: TokenRefreshError): Promise<void> {
    switch (error.statusCode) {
      case 401: // Unauthorized - tokens fully expired
        await this.triggerReauthentication();
        break;
      case 429: // Rate limited
        await this.implementBackoffStrategy();
        break;
      case 500: // Server error
        await this.retryWithExponentialBackoff();
        break;
      default:
        await this.alertOperations(error);
    }
  }
  
  async triggerReauthentication(): Promise<void> {
    // 1. Alert operations team
    // 2. Disable GHL-dependent services temporarily
    // 3. Provide instructions for manual re-authentication
    // 4. Queue retry once new tokens available
  }
}
```

## 🚀 **Implementation Strategy**

### **Phase 1: Manual Bootstrap (Days 1-2)**

**One-Time Setup Process**:

1. **Human Authentication**:
   ```bash
   # Run authentication helper
   npm run authenticate-ghl
   
   # Browser opens to GHL login
   # Human completes: email + password + 2FA
   # Tokens extracted and stored securely
   ```

2. **Token Storage**:
   ```json
   {
     "GHL": {
       "TOKEN": "eyJhbGciOiJSU...",
       "TOKEN_TYPE": "admin_user", 
       "API_TOKEN": "eyJhbGciOiJIU...",
       "WORKFLOW_TOKEN": "53782ca3-33fb...",
       "LOCATION_IDS": ["3MF7Qje6BuQlkuO9gSs5", "yrMl7UtmMqo31qLMP76W"],
       "EXPIRES_AT": "2025-10-06T03:30:00Z"
     }
   }
   ```

3. **Automatic Refresh Activation**:
   ```typescript
   // Token refresh service starts immediately
   await tokenRefreshService.startRefreshScheduler(initialTokens);
   ```

### **Phase 2: Automated Maintenance (Ongoing)**

**50-Minute Refresh Cycle**:
- ✅ **Minute 50**: Automatic token refresh triggered
- ✅ **Success**: New tokens stored, cycle continues
- ❌ **Failure**: Exponential backoff + operations alert

**Health Monitoring**:
- 📊 **Dashboard**: Token expiry countdown
- 🚨 **Alerts**: < 10 minutes to expiry
- 📱 **Notifications**: Refresh failures

### **Phase 3: Failure Recovery (Exception Handling)**

**Re-Authentication Trigger**:
```typescript
// When all refresh attempts fail
const reauthRequired = await fallbackManager.detectReauthRequired();

if (reauthRequired) {
  // 1. Send alert to operations
  await slackBot.sendAlert({
    message: "🚨 GHL re-authentication required",
    action: "Please run: npm run authenticate-ghl",
    urgency: "HIGH"
  });
  
  // 2. Gracefully disable GHL features
  await featureFlags.disable('ghl-integration');
  
  // 3. Queue requests for retry
  await requestQueue.pauseGHLRequests();
}
```

## 📊 **Operational Considerations**

### **Security**

✅ **Token Storage**: Google Secret Manager with rotation  
✅ **Access Control**: Service account with minimal permissions  
✅ **Audit Logging**: All token operations logged  
✅ **Encryption**: Tokens encrypted at rest and in transit

### **Monitoring & Alerting**

📈 **Metrics**:
- Token refresh success rate (target: >99%)
- Time to token expiry (alert: <10 min)
- Authentication failure count
- API request success rate with tokens

🚨 **Alerts**:
- **CRITICAL**: Token refresh failed (3 attempts)
- **WARNING**: Token expires in <10 minutes
- **INFO**: Manual re-authentication required

### **Disaster Recovery**

🆘 **Re-Authentication Procedure**:
1. Operations receives alert
2. Human runs authentication helper
3. Completes login + 2FA in browser
4. Tokens automatically extracted and stored
5. Refresh service resumes normal operation

## 🎯 **Success Criteria**

### **Reliability**
- ✅ **99%+ Token Uptime**: Automatic refresh maintains valid tokens
- ✅ **< 5 min Recovery**: Fast recovery from failures
- ✅ **Zero Data Loss**: Queued requests retry after recovery

### **Operational Excellence**  
- ✅ **Minimal Human Intervention**: Re-auth only when necessary
- ✅ **Clear Runbooks**: Step-by-step recovery procedures
- ✅ **Proactive Monitoring**: Issues detected before impact

### **Security Compliance**
- ✅ **Token Rotation**: Regular refresh prevents stale tokens
- ✅ **Secure Storage**: No tokens in code or logs
- ✅ **Audit Trail**: Complete token lifecycle tracking

---

**Key Insight**: The human authentication step is **unavoidable but manageable** - it's a one-time bootstrap operation that enables weeks/months of automated operation before requiring intervention again.

**Next Steps**: 
1. Implement authentication helper script
2. Build token refresh service  
3. Create monitoring dashboard
4. Establish operational runbooks