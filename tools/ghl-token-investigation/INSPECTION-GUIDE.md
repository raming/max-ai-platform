# GHL Browser API Inspection & Testing Guide

**Purpose**: Systematic discovery and documentation of GoHighLevel's browser client APIs, request headers, authentication mechanisms, and integration patterns to inform architectural decisions on proxy encapsulation vs. direct browser access.

**Scope**: This guide provides step-by-step instructions for capturing GHL's actual network calls, authentication flows, and client-side API structures using Puppeteer headless browser automation.

---

## Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **GHL Account** with admin access
3. **Location ID(s)** to test against
4. **Puppeteer** (handles headless browser automation)

### Installation

```bash
cd tools/ghl-token-investigation
npm install
```

### Basic Inspection

#### Option 1: Manual Login (Recommended for first run)

Opens a visible browser window for you to log in manually while the tool captures all API calls:

```bash
npm run inspect-apis
```

The browser will:
- Open at https://app.gohighlevel.com
- Allow you to log in with your credentials
- Capture all XHR/fetch calls automatically
- Output results to `ghl-api-capture-*.json`, `ghl-headers-*.json`, etc.

#### Option 2: Headless with Credentials

For automated/CI runs:

```bash
GHL_EMAIL=user@example.com GHL_PASSWORD=password npm run inspect-apis:headless
```

---

## Inspection Tool Overview

### File: `inspect-browser-apis.js`

**What it captures**:

1. **Network Calls** — All XHR/fetch requests to GHL APIs
   - Method, URL, endpoint path
   - Request headers (Authorization, Content-Type, etc.)
   - Request body (truncated to 500 chars)
   - Response status, headers, and body (truncated to 1000 chars)

2. **Headers Mapping** — Aggregated by endpoint
   - Authorization schemes (Bearer, Basic, etc.)
   - Content-Type patterns
   - Rate limit headers (X-RateLimit-*)
   - Custom headers used by GHL

3. **Authentication Details**
   - Cookies (token-related)
   - LocalStorage/SessionStorage keys
   - JWT token analysis (exp, iss, aud, scope)
   - Token lifecycle and expiration

4. **DOM & Browser API Analysis**
   - Window global objects (API references)
   - LocalStorage/SessionStorage keys
   - Available browser APIs (fetch, XMLHttpRequest, WebSocket)

5. **Workflows & Custom Fields**
   - Trigger definitions
   - Action definitions
   - Custom field types and metadata

6. **Console Output** — All console logs/errors for debugging

**Output Files**:

| File | Contents |
|------|----------|
| `ghl-api-capture-{timestamp}.json` | Comprehensive findings: all endpoints, requests, responses, tokens |
| `ghl-headers-{timestamp}.json` | Headers mapping by endpoint |
| `ghl-console-{timestamp}.json` | Console logs and errors |
| `ghl-dom-{timestamp}.json` | DOM analysis, storage elements |
| `ghl-inspection-summary-{timestamp}.json` | Summary: endpoint count, API call count, token count |

---

## Guided Inspection Workflow

### Step 1: Initial Authentication Capture

Run the tool with manual login to capture the full authentication flow:

```bash
npm run inspect-apis
# The browser will open automatically
# Log in with your GHL credentials (including 2FA if required)
# Wait for "Inspection completed successfully"
```

**What to check after this step**:

1. Open `ghl-inspection-summary-{timestamp}.json`:
   ```json
   {
     "totalEndpointsCaptured": 24,
     "totalAPICallsCaptured": 156,
     "tokensFound": 3
   }
   ```

2. Open `ghl-headers-{timestamp}.json` to see:
   - Which endpoints require Authorization headers
   - What auth scheme is used (Bearer, Basic, API-Key, etc.)
   - Common headers across endpoints

3. Open `ghl-api-capture-{timestamp}.json` to see:
   - Full request/response samples
   - Token analysis with expiration times
   - Endpoint groupings

### Step 2: Navigation & Section Inspection

The tool automatically navigates to key sections:
- `/contacts` — Contact management APIs
- `/workflows` — Workflow/automation APIs
- `/automations` — Automation triggers/actions
- `/settings` — Configuration APIs
- `/settings/custom-fields` — Custom field definitions

Each section triggers its own API calls which are captured.

### Step 3: Headers Analysis

From `ghl-headers-{timestamp}.json`, identify:

1. **Authentication Pattern**:
   ```json
   "/contacts": {
     "sampleHeaders": {
       "authorization": "Bearer eyJhbGc...",
       "content-type": "application/json",
       "accept": "application/json"
     }
   }
   ```

2. **Rate Limit Headers** (if present):
   ```json
   "x-ratelimit-limit": "1000",
   "x-ratelimit-remaining": "999",
   "x-ratelimit-reset": "1730000000"
   ```

3. **Custom Headers**:
   - Look for `X-API-Key`, `X-Location-Id`, `X-Requested-With`, etc.

### Step 4: Token Analysis

From `ghl-api-capture-{timestamp}.json`, check `tokens` array:

```json
{
  "type": "JWT",
  "source": "https://api.gohighlevel.com/v1/auth/login",
  "decoded": {
    "sub": "user-id",
    "iss": "https://gohighlevel.com",
    "exp": "2025-10-25T12:00:00.000Z",
    "scope": "admin:contacts,admin:workflows"
  }
}
```

**Use this to determine**:
- Token expiration time (for refresh logic)
- Required scopes for different endpoints
- JWT issuer (informs proxy validation)

### Step 5: Endpoint Mapping

From `ghl-api-capture-{timestamp}.json`, endpoints are grouped like:

```json
"endpoints": {
  "/v1/contacts": {
    "methods": ["GET", "POST"],
    "requestCount": 12,
    "responseCount": 12,
    "requestSamples": [ { "method": "GET", "url": "...", "headers": {...} } ]
  },
  "/v1/workflows": {
    "methods": ["GET"],
    "requestCount": 3,
    "responseCount": 3
  }
}
```

**Use this to create**:
- API endpoint documentation
- Method-based routing rules
- Rate limit configuration by endpoint

---

## Practical Inspection Scenarios

### Scenario 1: Capture Contact Operations

```bash
npm run inspect-apis
# In the browser:
# 1. Log in
# 2. Click "Contacts" in the sidebar
# 3. Create a new contact manually
# 4. Edit contact custom fields
# 5. Save and exit
# Tool captures all related API calls
```

**Expected captures**:
- `/v1/contacts` POST (create)
- `/v1/contacts/{id}` GET/PATCH (read/update)
- `/v1/customFields` GET (field discovery)
- Webhook registrations (if configured)

### Scenario 2: Capture Workflow Operations

```bash
npm run inspect-apis
# In the browser:
# 1. Log in
# 2. Click "Workflows" in the sidebar
# 3. View workflow list
# 4. Open a workflow
# 5. Check triggers and actions
# Exit
```

**Expected captures**:
- `/v1/workflows` GET (list workflows)
- `/v1/workflows/{id}` GET (get workflow details)
- `/v1/triggers` GET (list trigger types)
- `/v1/actions` GET (list action types)

### Scenario 3: Capture Authentication Flow

```bash
npm run inspect-apis
# In the browser:
# 1. Don't log in immediately
# 2. Observe which endpoints are called
# 3. Log in via email/password
# 4. Observe 2FA flow (if required)
# 5. Observe token response
# 6. Wait for dashboard load
# Exit
```

**Expected captures**:
- `/v1/auth/login` POST (login)
- `/v1/auth/mfa/verify` POST (2FA, if enabled)
- `/v1/auth/token` GET/POST (token refresh)
- Token details with expiration

---

## Analysis: Headers & Authentication

### Reading `ghl-headers-{timestamp}.json`

Example output:

```json
{
  "/v1/contacts": {
    "sampleHeaders": {
      "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "content-type": "application/json",
      "accept": "application/json",
      "x-api-version": "v1",
      "user-agent": "Mozilla/5.0..."
    }
  },
  "/v1/workflows": {
    "sampleHeaders": {
      "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "content-type": "application/json",
      "accept": "application/json"
    }
  }
}
```

**Interpret as**:
1. **Authorization Scheme**: `Bearer` (JWT token)
2. **Content Negotiation**: All endpoints expect `application/json`
3. **Versioning**: API version in header or path
4. **Custom Headers**: Check for location ID, workspace ID, etc.

### Token Lifecycle

From `ghl-api-capture-{timestamp}.json` tokens array:

```json
{
  "type": "JWT",
  "length": 500,
  "prefix": "eyJhbGciOiJIUzI1NiIs...",
  "decoded": {
    "iss": "https://gohighlevel.com",
    "aud": ["app.gohighlevel.com"],
    "exp": "2025-10-25T12:30:45.000Z",
    "iat": "2025-10-24T12:30:45.000Z",
    "scope": "admin:*"
  }
}
```

**Use this for**:
- Token refresh timing (exp - now = TTL)
- Scope validation (which APIs are allowed)
- Audience validation (where token can be used)

---

## Architecture Findings Application

### For Proxy Encapsulation Decision

1. **If headers show Bearer JWT**:
   - ✅ Suitable for token proxy (server-side token management)
   - ✅ Can hide tokens from browser
   - ✅ Allows rate limiting at proxy layer

2. **If endpoints require special headers** (e.g., X-Location-Id):
   - ✅ Proxy can inject these headers before forwarding
   - ✅ Client never needs to know about them

3. **If rate limits are present** (X-RateLimit-*):
   - ✅ Proxy can monitor and enforce limits
   - ✅ Can queue requests if needed

### For API Contract Definition

Use captured requests/responses to create formal contracts:

```json
{
  "endpoint": "/v1/contacts",
  "method": "POST",
  "authentication": "Bearer JWT",
  "requestBody": { ... },
  "responseBody": { ... },
  "rateLimit": {
    "limit": 1000,
    "window": "1h"
  }
}
```

### For Testing & Validation

Use captured headers and payloads to:
1. Create integration tests
2. Validate adapter implementations
3. Document expected behavior
4. Build contract tests

---

## Troubleshooting

### Issue: Browser Opens But Doesn't Capture API Calls

**Solution**:
1. Check if XHR/fetch requests are actually being made (open DevTools in browser)
2. Verify GHL domain is not blocking Puppeteer (try disabling `--disable-web-security`)
3. Check if endpoints are being navigated to (slow page loads may require more wait time)

### Issue: Login Fails

**Solution**:
1. Verify credentials are correct
2. Check if GHL account has 2FA enabled (manual login recommended)
3. Try manual login instead of automated

### Issue: Token Not Found

**Solution**:
1. Ensure you're logged in successfully (check browser window)
2. Some tokens may be stored in cookie instead of response body
3. Check `ghl-dom-{timestamp}.json` for storage elements

### Issue: Rate Limit Headers Missing

**Solution**:
1. Rate limits may only appear on high-traffic endpoints
2. Some endpoints may not expose rate limit info in headers
3. Check GHL documentation for per-endpoint limits

---

## Next Steps: Using Findings

After inspection, use findings to:

1. **Create Adapter Contracts** (`docs/contracts/ghl-*.schema.json`)
   - Use captured request/response samples
   - Define authorization requirements

2. **Build Proxy Configuration**
   - Map endpoints to proxy routes
   - Inject authentication headers
   - Configure rate limiting

3. **Implement Token Management**
   - Use token expiration data for refresh logic
   - Store tokens securely (server-side)
   - Monitor token health

4. **Document API Integration** (`docs/design/integrations/crm-port.md`)
   - Use actual endpoints from inspection
   - Document authentication flow
   - Note rate limits and quotas

5. **Create Testing Scenarios** (`client/tests/integration/`)
   - Use real request/response samples
   - Validate adapter against captured data
   - Mock GHL using captured payloads

---

## Reference: Output File Schemas

### `ghl-api-capture-{timestamp}.json`

```typescript
{
  timestamp: string;
  apis: Array<{
    endpoint: string;
    method: string;
    url: string;
    timestamp: string;
  }>;
  endpoints: Record<string, {
    methods: string[];
    requestSamples: Array<{
      method: string;
      url: string;
      headers: Record<string, string>;
      body: string | null;
    }>;
    responseSamples: Array<{
      status: number;
      headers: Record<string, string>;
      body: string | null;
    }>;
  }>;
  tokens: Array<{
    type: 'JWT' | 'opaque';
    source: string;
    decoded?: {
      sub: string;
      iss: string;
      aud: string;
      exp: string;
      scope: string;
    };
  }>;
  errors: Array<{
    timestamp: string;
    error: string;
    stack?: string;
  }>;
}
```

### `ghl-headers-{timestamp}.json`

```typescript
Record<string, {
  sampleHeaders: Record<string, string>;
  commonPatterns: Record<string, any>;
}>
```

### `ghl-inspection-summary-{timestamp}.json`

```typescript
{
  timestamp: string;
  totalEndpointsCaptured: number;
  totalAPICallsCaptured: number;
  tokensFound: number;
  endpointSummary: Array<{
    endpoint: string;
    methods: string[];
    requestCount: number;
    responseCount: number;
  }>;
}
```

---

## Commands Reference

```bash
# Inspect with visible browser (recommended for first run)
npm run inspect-apis

# Inspect headless (for CI/automation)
npm run inspect-apis:headless

# Manual login (opens browser for you to log in)
npm run inspect-apis

# Automated login with credentials
GHL_EMAIL=user@example.com GHL_PASSWORD=password npm run inspect-apis:headless

# Without devtools (faster)
DEVTOOLS=false npm run inspect-apis
```

---

## Security Considerations

⚠️ **Important**:

1. **Credentials**: Never commit `GHL_EMAIL`/`GHL_PASSWORD` to git
2. **Output Files**: `ghl-api-capture-*.json` may contain tokens
   - Don't commit to git
   - Keep in `.gitignore`
   - Delete after extracting what you need

3. **Token Handling**:
   - Tokens captured are time-limited (< 1 hour typically)
   - Still, don't share output files publicly
   - Use only for architectural analysis

4. **Recommended Workflow**:
   ```bash
   # Run inspection locally
   npm run inspect-apis
   
   # Review findings in ghl-api-capture-*.json
   # Extract what's needed for contracts/documentation
   
   # Delete sensitive files
   rm ghl-api-capture-*.json ghl-headers-*.json
   
   # Commit only the documented architecture
   git add docs/design/integrations/ghl-*.md
   ```

---

## Contact & Support

For questions about inspection findings or architecture decisions:
- Contact: @architect.morgan-lee
- Reference issue: ARCH-14
- Documentation: `/docs/design/integrations/`
