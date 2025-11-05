# GHL API Inspector - Setup and Usage Guide

**Purpose**: Automate GoHighLevel browser inspection to capture all API calls, HTTP headers, authentication patterns, and network behavior.

**Tool**: Puppeteer (headless Chrome automation)

---

## 1. Prerequisites

### System Requirements
- Node.js 16+ (verify with `node --version`)
- npm 7+ (verify with `npm --version`)
- At least 1GB free disk space for Chromium download
- GHL account with admin or sufficient permissions for testing

### Environment
```bash
# Verify Node.js is available
node --version  # Expected: v16.0.0 or higher
npm --version   # Expected: 7.0.0 or higher
```

---

## 2. Installation

### Step 1: Navigate to tool directory
```bash
cd /Users/rayg/repos/max-ai/platform/tools/ghl-api-inspector
```

### Step 2: Install dependencies
```bash
npm install
```

This will install:
- **puppeteer** (21.x): Headless browser automation
- **dotenv** (16.x): Environment variable management

Expected output:
```
added X packages, in Y seconds
```

### Step 3: Verify installation
```bash
npm list
```

Should show:
```
ghl-api-inspector@1.0.0
├── dotenv@16.x.x
└── puppeteer@21.x.x
```

---

## 3. Configuration

### Option A: Environment Variables (Recommended)

Create a `.env` file in the tool directory:

```bash
# .env
GHL_EMAIL=your-ghl-email@example.com
GHL_PASSWORD=your-ghl-password
GHL_OUTPUT_FILE=ghl-capture.json
GHL_HEADLESS=true
```

**Security Note**: Add `.env` to `.gitignore` - never commit credentials!

### Option B: Command-Line Arguments

```bash
node puppeteer-capture.js \
  --email "your-ghl-email@example.com" \
  --password "your-ghl-password" \
  --output ghl-capture.json \
  --headless true
```

### Option C: Environment Variables (Shell)

```bash
export GHL_EMAIL="your-ghl-email@example.com"
export GHL_PASSWORD="your-ghl-password"
export GHL_OUTPUT_FILE="ghl-capture.json"
export GHL_HEADLESS="true"

node puppeteer-capture.js
```

---

## 4. Running the Inspector

### Basic Execution (Headless)

```bash
npm run inspect
```

**Expected behavior:**
1. Browser launches (invisible in headless mode)
2. Navigates to GHL login page
3. Enters credentials
4. Logs in and navigates through UI sections
5. Captures all API calls, headers, WebSocket connections
6. Closes browser
7. Outputs results to `ghl-capture.json` and logs to `ghl-capture.log`

**Expected output:**
```
[2025-10-24T14:30:45.123Z] [INFO] Starting GHL API Inspector...
[2025-10-24T14:30:45.234Z] [INFO] Launching Puppeteer browser...
[2025-10-24T14:30:47.456Z] [INFO] Navigating to GHL login page...
[2025-10-24T14:30:49.123Z] [INFO] Waiting for email input field...
[2025-10-24T14:30:50.234Z] [INFO] Entering credentials...
...
[2025-10-24T14:35:12.789Z] [INFO] === CAPTURE SUMMARY ===
[2025-10-24T14:35:12.790Z] [INFO] Total API calls captured: 347
[2025-10-24T14:35:12.790Z] [INFO] Unique endpoints: 52
[2025-10-24T14:35:12.790Z] [INFO] Rate limit headers found: 12
...
```

### Interactive Execution (Visible Browser)

To see the browser in action:

```bash
npm run inspect:interactive
```

Or:

```bash
node puppeteer-capture.js --headless false
```

**Note**: Browser window will appear; do not close it manually - let the script complete.

### Debug Mode

```bash
npm run inspect:debug
```

This logs additional debug information to both console and log file.

---

## 5. Output Files

### `ghl-capture.json` (Main Output)

**Structure:**
```json
{
  "metadata": {
    "captureDate": "2025-10-24T14:35:12.789Z",
    "platform": "GoHighLevel",
    "baseUrl": "https://app.gohighlevel.com"
  },
  "authentication": {
    "oauth_endpoints": [
      "https://app.gohighlevel.com/oauth/authorize",
      ...
    ],
    "token_patterns": [
      {
        "key": "ghl_auth_token",
        "type": "localStorage",
        "length": 234,
        "format": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      },
      ...
    ],
    "session_headers": [
      {
        "header": "Authorization",
        "sampleValue": "Bearer [REDACTED]"
      },
      ...
    ],
    "auth_flow": [
      "Entered email",
      "Entered password",
      "Clicked login"
    ]
  },
  "api_calls": [
    {
      "timestamp": "2025-10-24T14:30:50.123Z",
      "url": "https://app.gohighlevel.com/api/v1/contacts",
      "method": "GET",
      "status": 200,
      "headers": {
        "Authorization": "[REDACTED]",
        "X-API-Key": "[REDACTED]",
        "Content-Type": "application/json",
        "X-RateLimit-Limit": "300",
        "X-RateLimit-Remaining": "299"
      }
    },
    ...
  ],
  "websocket_connections": [
    {
      "timestamp": "2025-10-24T14:31:02.456Z",
      "log": "[WS_CONNECT] wss://api.gohighlevel.com/socket.io/?transport=websocket"
    },
    ...
  ],
  "rate_limit_headers": [
    {
      "url": "https://app.gohighlevel.com/api/v1/contacts",
      "headers": {
        "X-RateLimit-Limit": "300",
        "X-RateLimit-Remaining": "298",
        "X-RateLimit-Reset": "1698157872"
      }
    },
    ...
  ],
  "errors": [
    {
      "timestamp": "2025-10-24T14:32:15.789Z",
      "url": "https://app.gohighlevel.com/api/v1/settings/invalid",
      "method": "GET",
      "error": "net::ERR_NAME_NOT_RESOLVED"
    },
    ...
  ],
  "navigation_log": [
    {
      "timestamp": "2025-10-24T14:30:45.123Z",
      "action": "navigate",
      "url": "https://app.gohighlevel.com/login"
    },
    ...
  ],
  "summary": {
    "total_api_calls": 347,
    "unique_endpoints": 52,
    "unique_domains": 3,
    "rate_limit_headers_found": 12,
    "websocket_connections": 2,
    "errors": 3,
    "oauth_endpoints_found": 4,
    "token_patterns_found": 2
  }
}
```

**Key Sections:**
- **authentication**: OAuth endpoints, token patterns, session headers
- **api_calls**: Full API call inventory with methods, status codes, headers
- **rate_limit_headers**: Extracted rate limit information
- **websocket_connections**: Real-time communication patterns
- **errors**: Failed requests for troubleshooting
- **summary**: Quick statistics

### `ghl-capture.log` (Execution Log)

Contains timestamped execution details:
```
[2025-10-24T14:30:45.123Z] [INFO] Starting GHL API Inspector...
[2025-10-24T14:30:45.234Z] [INFO] Configuration: headless=true, timeout=30000ms
[2025-10-24T14:30:46.456Z] [INFO] Launching Puppeteer browser...
...
```

---

## 6. Interpreting Results

### Authentication Analysis

**Look for:**
- **OAuth endpoints**: Where authentication happens
- **Token patterns**: Format and storage (localStorage, sessionStorage)
- **Session headers**: Required headers for authenticated requests
- **Auth flow**: Steps required for login

**Example findings:**
```json
{
  "oauth_endpoints": [
    "https://app.gohighlevel.com/api/v1/oauth/authorize",
    "https://app.gohighlevel.com/api/v1/oauth/token"
  ],
  "token_patterns": [
    {
      "key": "ghl_auth_token",
      "type": "localStorage",
      "format": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // JWT
    }
  ]
}
```

### API Endpoint Discovery

**Look for:**
- **Unique endpoints**: Count and categorize by resource
- **HTTP methods**: GET, POST, PUT, PATCH, DELETE usage
- **Status codes**: Success (2xx), client errors (4xx), server errors (5xx)

**Example pattern analysis:**
```
GET /api/v1/contacts - 347 calls (listing, filtering)
POST /api/v1/contacts - 8 calls (creation)
PUT /api/v1/contacts/{id} - 12 calls (updates)
GET /api/v1/opportunities - 156 calls (pipeline data)
```

### Rate Limiting Analysis

**Key headers to identify:**
```
X-RateLimit-Limit: 300          # Max requests per window
X-RateLimit-Remaining: 298      # Remaining requests
X-RateLimit-Reset: 1698157872   # Unix timestamp when limit resets
```

**Actions:**
- Document rate limits per endpoint
- Identify burst vs sustained limits
- Calculate quota usage patterns

### WebSocket Connections

**Look for:**
- **Connection URLs**: Identify real-time endpoints
- **Message patterns**: Event types and frequencies
- **Error recovery**: How disconnections are handled

**Example:**
```json
{
  "websocket_connections": [
    {
      "url": "wss://api.gohighlevel.com/socket.io/?transport=websocket",
      "events": ["contact:updated", "opportunity:created", "message:received"]
    }
  ]
}
```

---

## 7. Troubleshooting

### Issue: "Cannot find module 'puppeteer'"

**Solution:**
```bash
npm install puppeteer
```

### Issue: "Timeout waiting for selector"

**Cause**: Page structure changed or login selector not found

**Solution:**
1. Run in interactive mode to see what's happening:
   ```bash
   npm run inspect:interactive
   ```
2. Check browser console for errors
3. Update selector in `puppeteer-capture.js` if needed

### Issue: "Email/password rejected"

**Cause**: Credentials invalid or account restrictions

**Solution:**
1. Verify GHL credentials are correct
2. Check if account requires 2FA (not supported yet)
3. Use `.env` file instead of CLI args

### Issue: "Out of memory" or crash

**Cause**: Browser consuming too much memory

**Solution:**
```bash
# Increase Node.js heap limit
NODE_OPTIONS=--max-old-space-size=4096 npm run inspect
```

### Issue: "No API calls captured"

**Cause**: GHL UI may have changed or requires different navigation

**Solution:**
1. Run in interactive mode and manually navigate UI sections
2. Check `ghl-capture.log` for navigation errors
3. Update navigation paths in `puppeteer-capture.js`

### Issue: Network timeouts

**Cause**: GHL server slow or network issue

**Solution:**
```bash
# Increase timeouts
GHL_TIMEOUT=60000 node puppeteer-capture.js
```

---

## 8. Next Steps

Once you have captured data:

1. **Analyze Results**:
   ```bash
   # Extract unique endpoints
   cat ghl-capture.json | jq '.api_calls[].url' | sort | uniq -c
   
   # Extract rate limit patterns
   cat ghl-capture.json | jq '.rate_limit_headers'
   
   # Count API calls per resource
   cat ghl-capture.json | jq '.api_calls | group_by(.url) | map({url: .[0].url, count: length})'
   ```

2. **Create Documentation**:
   - Use results to populate `docs/design/ghl-limitations/browser-client-apis.md`
   - Document API patterns, rate limits, authentication requirements
   - Identify gaps vs CRM Port interface

3. **Update CRM Adapter**:
   - Refine `/docs/design/integrations/crm-port.md` based on findings
   - Plan fallback strategies for unsupported operations
   - Design error handling for rate limits and quotas

---

## 9. Advanced Usage

### Custom Navigation Paths

Edit `puppeteer-capture.js` to add custom navigation:

```javascript
const navigationPaths = [
  { path: '/contacts', label: 'Contacts' },
  { path: '/custom-page', label: 'My Custom Page' },
];
```

### Capturing Specific User Workflows

Modify the script to record specific workflows:

```javascript
// After login, execute custom workflow
await page.evaluate(() => {
  // Custom JavaScript to interact with page
  document.querySelector('.filter-button')?.click();
});
```

### Multiple Run Comparison

```bash
# Run 1
npm run inspect > ghl-capture-1.json

# Make changes to GHL

# Run 2
npm run inspect > ghl-capture-2.json

# Compare differences
diff ghl-capture-1.json ghl-capture-2.json
```

---

## 10. Security Notes

⚠️ **Important**: Sensitive data handling

- **Credentials**: Store in `.env` file, never in version control
- **Tokens**: Automatically redacted in output before saving
- **Logs**: May contain headers with sensitive values - review before sharing
- **Output files**: Do not commit `ghl-capture.json` if it contains real credentials

**Recommended practice:**
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "ghl-capture*.json" >> .gitignore
echo "ghl-capture*.log" >> .gitignore
```

---

## 11. References

- **Puppeteer Documentation**: https://pptr.dev/
- **GoHighLevel API Docs**: https://highlevel.stoplight.io/
- **Issue #14**: GHL Limitations Assessment (GitHub issue link)
- **Related Docs**: `docs/design/integrations/crm-port.md`

---

**Last Updated**: 2025-10-24  
**Status**: Ready for use  
**Support**: Contact Platform Architect team
