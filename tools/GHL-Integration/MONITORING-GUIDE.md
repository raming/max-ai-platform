# GHL API Integration - Comprehensive Monitoring System

## Overview

This system uses Puppeteer to monitor and document all API calls made by the GoHighLevel (GHL) admin portal, capturing:

- **Every API call** with full headers and authentication methods
- **Authentication patterns** (token-id vs Bearer tokens, refresh mechanisms)
- **Header usage** across different endpoints
- **Token refresh events** and their triggers
- **Endpoint patterns** and their auth requirements

## Files Generated

### 1. `1-API-Calls-Complete-Log.json`
**Complete log of every API call** with:
- Timestamp
- URL and HTTP method
- Full request and response headers
- Authentication methods used
- Request/response body (when available)
- Response timing

**Use case**: Deep dive analysis of specific API calls

### 2. `2-Authentication-Patterns.json`
**Authentication method analysis**:
- token-id usage frequency
- Authorization/Bearer token usage
- Custom authentication headers
- Associated headers for each method

**Use case**: Understanding how the portal authenticates with the backend

### 3. `3-Header-Patterns.json`
**All headers used** across the API:
- Critical headers (version, token-id, authorization)
- Optional headers (channel, source, baggage)
- Unique values for each header
- Frequency of each header

**Use case**: Building correct API requests with proper headers

### 4. `4-Endpoint-Registry.json`
**All discovered endpoints** with:
- Endpoint path
- HTTP method
- Call frequency
- Authentication methods used
- Headers required

**Use case**: API reference documentation

### 5. `5-Token-Refresh-Events.json`
**Token refresh tracking**:
- Refresh event timestamps
- Refresh endpoint URLs
- Authentication used for refresh
- Headers sent during refresh

**Use case**: Understanding token lifecycle and refresh mechanisms

### 6. `README.md`
**Human-readable guide** summarizing:
- High-level statistics
- Authentication methods detected
- Critical headers and their usage
- Top endpoints
- Implementation notes

## Running the Monitor

### Setup
```bash
cd /Users/rayg/repos/max-ai/website/scripts/GHL-Integration
npm install
```

### Start Monitoring
```bash
npm run monitor
```

The script will:
1. Launch Puppeteer (visible browser window)
2. Navigate to app.1prompt.com/login
3. Log in automatically with provided credentials
4. Monitor all API calls
5. Record headers, authentication, and timing

### Manual Interaction
Once logged in, interact with the admin portal:
- Navigate to different sections (Dashboard, Contacts, Settings, etc.)
- Click through menu items
- Perform actions (create, update, delete)
- Each action generates API calls that are recorded

### Save Results
Press **Ctrl+C** to stop monitoring and automatically save all documentation.

## Key Authentication Patterns Documented

### Pattern 1: Token-ID Header
```
Header: token-id
Value: JWT token
Usage: Most API calls
```

### Pattern 2: Bearer Token
```
Header: Authorization
Value: Bearer {jwt_token}
Usage: Some endpoints, user-specific calls
```

### Pattern 3: Version Header
```
Header: version
Value: (to be determined)
Usage: All API calls
Required: Yes
```

### Pattern 4: Token Refresh
```
Endpoint: /appengine/api/token/update
Method: POST
Trigger: 401 responses or token expiry
Response: New JWT token
```

## Critical Findings

After monitoring the portal, you'll understand:

1. **Which endpoints require which authentication method**
   - token-id vs Bearer
   - When each is used
   - Fallback behavior

2. **All required headers**
   - Version header format/validation
   - Content-Type requirements
   - Custom headers (channel, source, etc.)

3. **Token refresh mechanism**
   - When refresh is triggered
   - How refresh requests are authenticated
   - Token lifespan

4. **Endpoint patterns**
   - Which endpoints use which auth methods
   - Most frequently called endpoints
   - Headers required per endpoint

## Using the Data

### Building a Complete API Client

Use the generated data to:

1. Create API wrappers that match header patterns
2. Implement token refresh based on refresh event data
3. Validate version header format
4. Handle authentication method selection

### Debugging API Issues

Reference the complete log to:
- Find which headers are sent for specific endpoints
- Identify authentication failures
- Understand timing issues
- Replicate exact API calls

### API Documentation

Use the endpoint registry to:
- Document all discovered endpoints
- List required headers
- Show authentication methods
- Provide implementation examples

## Next Steps

1. **Run the monitor** through different portal sections
2. **Review 2-Authentication-Patterns.json** to understand auth methods
3. **Check 3-Header-Patterns.json** for required headers
4. **Analyze 4-Endpoint-Registry.json** for endpoint patterns
5. **Use data to update API clients** with correct patterns

## Troubleshooting

**Monitor exits immediately**: 
- Check network connectivity
- Verify credentials in script

**No API calls captured**:
- Ensure you're interacting with the portal
- Check if URLs match filter criteria in script

**Token refresh not captured**:
- Monitor may need longer session to capture refresh
- Check 5-Token-Refresh-Events.json for any detected events

## Dependencies

- **puppeteer**: ^21.5.0 - Browser automation
- **dotenv**: ^16.3.1 - Environment variable management

## Configuration

Edit `monitor-ghl-api.js` to modify:
- `CREDENTIALS`: GHL login credentials
- `OUTPUT_DIR`: Where documentation is saved
- URL filters: Which API calls to track
- Timeout values: How long to monitor
