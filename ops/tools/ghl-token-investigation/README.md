# GHL Token Investigation Tools

This directory contains tools for investigating GoHighLevel (GHL) token refresh mechanisms to understand how to implement automated token management for our MaxAI platform integration.

## Overview

The investigation consists of two main components:

1. **`investigate-tokens.js`** - Puppeteer-based browser automation that captures network traffic during GHL login and usage
2. **`analyze-tokens.js`** - Analysis tool that processes captured data to identify token patterns and refresh mechanisms

## Prerequisites

```bash
npm install
```

## Investigation Process

### Step 1: Capture Network Traffic

Run the investigation script which will:
- Open a headless browser (visible for manual login)
- Navigate to GHL login page
- Monitor all network traffic, especially auth-related requests
- Capture token information from responses
- Monitor storage changes (localStorage, sessionStorage)

```bash
npm run investigate
```

**What to do during the investigation:**
1. Complete the GHL login process manually when prompted
2. Navigate around different sections of GHL
3. Wait for potential token refresh events
4. Try actions that might trigger API calls
5. Press ENTER when done monitoring

### Step 2: Analyze Results

After capturing data, analyze it for patterns:

```bash
npm run analyze ./investigation-results/ghl-investigation-YYYY-MM-DDTHH-MM-SS.json
```

## What Gets Captured

### Network Monitoring
- All authentication-related HTTP requests/responses
- Token-bearing requests (Authorization headers, cookies)
- Refresh endpoints and periodic API calls
- Request/response timing and patterns

### Token Analysis  
- JWT token structure and expiry times
- Refresh token detection
- Token lifetime patterns
- Storage mechanisms (cookies vs localStorage)

### Browser Storage
- localStorage and sessionStorage changes
- Token storage patterns
- Session management mechanisms

## Output Files

The investigation generates several output files in `./investigation-results/`:

- **`ghl-investigation-TIMESTAMP.json`** - Raw captured data
- **`summary-TIMESTAMP.md`** - Human-readable summary
- **`ghl-investigation-TIMESTAMP-analysis.json`** - Detailed analysis results  
- **`ghl-investigation-TIMESTAMP-analysis.md`** - Analysis report with recommendations

## Key Investigation Goals

### 1. Token Types
- Identify if GHL uses JWT access tokens
- Detect refresh tokens and their storage location
- Understand token expiry patterns

### 2. Refresh Mechanisms
- Find automatic refresh endpoints
- Identify periodic refresh patterns
- Understand session management approach

### 3. Implementation Strategy  
- Determine if programmatic refresh is possible
- Identify the optimal refresh timing
- Plan token proxy architecture

## Expected Findings

Based on the analysis, we expect to discover:

### Token Management Approach
- **Admin tokens** (broad permissions) vs **sub-account tokens** (limited scope)
- Token storage mechanism (cookies, localStorage, etc.)
- Token expiry and refresh patterns

### Refresh Strategy Options
1. **Refresh Token Flow** - If GHL provides refresh tokens
2. **Session Extension** - If tokens are refreshed via session endpoints  
3. **Manual Re-authentication** - If no automatic refresh is available

### Architecture Recommendations
- Token proxy service design
- Health monitoring requirements  
- Fallback procedures for failed refresh

## Security Considerations

- All captured tokens are truncated/redacted in output files
- No complete tokens are stored in investigation results
- Network logs sanitize sensitive headers and payloads
- Results should be treated as sensitive and not committed to repos

## Next Steps After Investigation

1. **Review Analysis Report** - Examine recommendations and patterns
2. **Design Token Proxy** - Create architecture based on findings
3. **Implement Refresh Logic** - Build automated refresh system
4. **Update Assessment** - Incorporate findings into GHL feasibility assessment

## Troubleshooting

### Browser Issues
- Ensure Puppeteer can launch Chromium (may need to install additional dependencies)
- Try running with different browser flags if login fails
- Check for popup blockers or security restrictions

### Network Capture Issues  
- Verify auth-related endpoints are being captured
- Check if GHL uses different domains for authentication
- Monitor console output for captured requests/responses

### Analysis Issues
- Ensure investigation JSON file exists and is valid
- Check that network logs contain auth-related traffic
- Verify token extraction worked during capture

## Related Documentation

- [GHL Assessment Overview](../../docs/design/assessments/ghl-feasibility.md)
- [Token Management Policy](../../docs/design/secrets-and-token-rotation.md)  
- [Secret Bundle Schema](../../docs/contracts/secret-bundle.schema.json)