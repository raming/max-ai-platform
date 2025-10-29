# GoHighLevel API Integration - Complete Documentation System

## Overview

This folder contains a **comprehensive Puppeteer-based monitoring system** that captures and documents:

1. ✅ **All API calls** made by the GHL admin portal
2. ✅ **Every header** sent with each request
3. ✅ **Authentication methods** (token-id vs Bearer)
4. ✅ **Token refresh mechanisms** and triggers
5. ✅ **Endpoint patterns** and requirements
6. ✅ **Complete implementation guide**

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Monitor
```bash
npm run monitor
```

The monitor will:
- Launch a browser window
- Log into GHL automatically
- Start recording all API calls
- Display real-time activity

### 3. Interact with Portal
Navigate through the GHL admin portal sections:
- Dashboard
- Contacts
- Locations
- Website/Pages
- Settings
- Any other sections

Each action triggers API calls that are recorded.

### 4. Stop and Save
Press **Ctrl+C** to stop monitoring.

The system automatically saves 6 comprehensive documentation files.

## Generated Documentation

### Files Created After Monitoring

| File | Content | Use Case |
|------|---------|----------|
| `1-API-Calls-Complete-Log.json` | Every API call with full headers | Deep analysis, debugging |
| `2-Authentication-Patterns.json` | Auth methods used (token-id, Bearer) | Understanding auth flow |
| `3-Header-Patterns.json` | All headers and their values | Building correct requests |
| `4-Endpoint-Registry.json` | All discovered endpoints | API reference |
| `5-Token-Refresh-Events.json` | Token refresh tracking | Understanding token lifecycle |
| `README.md` | Human-readable summary | Quick reference |

## Key Data Points Captured

### 1. Authentication Methods
- ✅ token-id header usage (JWT token)
- ✅ version header: `2021-07-28` (date-based format)
- ✅ channel header: `APP`
- ✅ source header: `WEB_USER`
- ✅ Custom authentication headers
- ✅ Frequency and distribution

### 2. Header Information
- ✅ Every header name and value
- ✅ Which endpoints use which headers
- ✅ Critical vs optional headers
- ✅ **Version header format**: `2021-07-28` (NOT `"1.0"` or number)

### 3. Endpoint Catalog
- ✅ URL path and method (GET, POST, PUT, etc.)
- ✅ Call frequency
- ✅ Required authentication method
- ✅ Headers needed per endpoint

### 4. Token Refresh Tracking
- ✅ When refresh occurs
- ✅ Refresh endpoint URL
- ✅ How refresh is authenticated
- ✅ Response handling

### 5. Performance Metrics
- ✅ Request timing
- ✅ Response status codes
- ✅ Response headers
- ✅ Response body (when available)

## Example Data Structure

### API Call Record
```json
{
  "timestamp": "2025-10-21T22:35:12.123Z",
  "url": "https://backend.leadconnectorhq.com/users/2XCxWZuZmB6oyQoi83X9",
  "method": "GET",
  "headers": {
    "token-id": "eyJhbGciOiJSUzI1NiIs...[truncated]",
    "version": "2",
    "content-type": "application/json",
    "channel": "web",
    "source": "admin"
  },
  "authMethods": {
    "token-id": true,
    "authorization": false,
    "bearer-token": false
  },
  "response": {
    "status": 200,
    "headers": {...}
  },
  "timing": {
    "duration": 145
  }
}
```

### Authentication Pattern
```json
{
  "method": "token-id",
  "count": 234,
  "associatedHeaders": [
    "content-type",
    "channel",
    "source",
    "version"
  ]
}
```

## Analysis Tools

### View Live Analysis
```bash
npm run analyze
```

Generates a report showing:
- Statistics summary
- Auth method distribution
- Most used headers
- Top endpoints
- Key findings and recommendations

## Integration Into Your Project

After collecting the data, use it to:

### 1. Build API Clients
```javascript
const headers = {
  'token-id': sessionToken,
  'version': '2',
  'content-type': 'application/json',
  'channel': 'web'
};
```

### 2. Implement Token Refresh
```javascript
async function refreshToken() {
  return axios.post('/appengine/api/token/update', {}, {
    headers: { 'token-id': currentToken }
  });
}
```

### 3. Handle Authentication Errors
```javascript
if (response.status === 401) {
  // Token expired, refresh and retry
  await refreshToken();
}
```

### 4. Validate Endpoints
Use `4-Endpoint-Registry.json` to verify endpoints exist and their requirements.

## Troubleshooting

### Monitor Exits Immediately
- Check internet connectivity
- Verify GHL credentials are correct
- Check if 1prompt.com is accessible

### No API Calls Captured
- Ensure you're interacting with the portal after login
- Wait for network requests to complete
- Check if URLs are being filtered correctly

### Incomplete Data
- Run monitor longer to capture more interactions
- Navigate through different portal sections
- Perform various actions (create, update, delete)

## Architecture

### Data Collection Flow
```
Puppeteer Browser
    ↓
Request/Response Events
    ↓
Header & Auth Extraction
    ↓
Data Normalization
    ↓
Endpoint Registry Building
    ↓
Pattern Analysis
    ↓
Documentation Generation
```

### Record Processing
1. **Capture**: Every API call with full headers
2. **Normalize**: Truncate sensitive data, standardize format
3. **Identify**: Detect auth method and required headers
4. **Track**: Aggregate by endpoint and pattern
5. **Document**: Generate multiple formats (JSON, Markdown)

## Output Directory Structure

```
GHL-Integration/
├── monitor-ghl-api.js
├── analyze-results.js
├── package.json
├── MONITORING-GUIDE.md
├── README.md (this file)
├── .env.example
└── api-documentation/
    ├── 1-API-Calls-Complete-Log.json
    ├── 2-Authentication-Patterns.json
    ├── 3-Header-Patterns.json
    ├── 4-Endpoint-Registry.json
    ├── 5-Token-Refresh-Events.json
    └── README.md
```

## Critical Insights You'll Discover

### Version Header Mystery
The data will reveal:
- Exact format of the version header
- Whether it's validated strictly
- What values are accepted
- How it affects API responses

### Token Lifecycle
- When tokens are issued
- How long they last
- When refresh is triggered
- How refresh requests work

### Endpoint Patterns
- Which endpoints support which auth methods
- Fallback behavior for failed auth
- Timing and performance characteristics
- Error handling patterns

## Next Steps

1. **Run monitoring** through main portal sections
2. **Review generated files** to understand patterns
3. **Update API client code** with discovered patterns
4. **Test implementations** against real endpoints
5. **Handle edge cases** revealed by the data

## Support

For issues or questions:
- Check `MONITORING-GUIDE.md` for detailed information
- Review generated JSON files for specific endpoint data
- Use `analyze-results.js` for automated insights

## Version History

- v1.0.0 - Initial release with comprehensive monitoring

---

**Generated Documentation System** - Automates the discovery of GoHighLevel API authentication patterns and endpoint requirements.
