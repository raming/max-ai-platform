# GoHighLevel API Authentication Knowledge Base

## Authentication Patterns Discovered

### 1. **Token-Id Header** (Primary Method)
- **Header**: `token-id`
- **Usage**: Used for most API calls instead of Authorization header
- **Format**: JWT token (same as GHL_SESSION_TOKEN)
- **Example**: `token-id: eyJhbGciOiJSUzI1NiIsImtpZCI6...`

### 2. **Authorization Header** (Alternative)
- **Header**: `Authorization`
- **Format**: `Bearer {jwt_token}`
- **Usage**: Some endpoints still use this (shorter tokens)
- **Example**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzb3...`

### 3. **Version Header** (Required - Multiple Formats)
- **Header**: `version`
- **Values Observed**: `2`, `1`, `latest` (all failed with "version header is invalid")
- **Usage**: Required for all API calls but validation is strict
- **Issue**: Current validation rejects all known version formats

### 4. **Developer Version Header**
- **Header**: `developer_version`
- **Usage**: Appears in some requests, possibly for API versioning

### 5. **Channel Header**
- **Header**: `channel`
- **Usage**: Request routing and identification

### 6. **Source Header**
- **Header**: `source`
- **Usage**: Request source identification

### 7. **Monitoring Headers**
- **baggage**: Distributed tracing
- **sentry-trace**: Error monitoring
- **sentry-environment**: `production`
- **sentry-release**: Build version (e.g., `f6e0d...`)

### 8. **Content-Type Headers**
- **Content-Type**: `application/json`
- **Accept**: Various MIME types

## API Endpoints Observed (Comprehensive)

### Authentication & Tokens
- `POST /appengine/api/token/update` - Token refresh (Bearer token)
- `POST /signin/refresh` - Login refresh (JWT token)
- `POST /oauth/2/login/signin/refresh` - Alternative refresh

### User Management
- `GET /users/2XCxWZuZmB6oyQoi83X9` - User profile
- `GET /users/` - List users
- `GET /users/2XCxWZuZmB6oyQoi83X9/features` - User features

### Company & Location
- `GET /agency/details` - Agency information
- `GET /company/Iir19ybG4Qtx9tEgJiX6` - Company details
- `GET /location/3MF7Qje6BuQlkuO9gSs5` - Location details
- `GET /location/yrMl7UtmMqo31qLMP76W` - Location data
- `GET /yrMl7UtmMqo31qLMP76W/token` - Location token

### Website & Pages
- `GET /page/data` - Page data
- `GET /page/C8xG8snSbLtUw2Ajzz0X` - Specific page content
- `GET /page/{pageId}` - Individual pages (multiple observed)
- `GET /custom-data/funnels` - Funnel data
- `GET /funnels/custom-fonts` - Custom fonts
- `GET /redis-key-data/C8xG8snSbLtUw2Ajzz0X` - Page Redis data

### Content & SEO
- `GET /yrMl7UtmMqo31qLMP76W/seo_search_atlas` - SEO search atlas
- `GET /yrMl7UtmMqo31qLMP76W/contentAI` - Content AI

### Products & Payments
- `GET /stripe/` - Stripe integration
- `GET /offers-products/3MF7Qje6BuQlkuO9gSs5` - Products
- `GET /products/` - Product catalog

### Calendar & Appointments
- `GET /calendars/c5bPfEoxI6xUbvP9NOCe` - Calendar data
- `GET /c5bPfEoxI6xUbvP9NOCe/free-slots` - Available slots
- `GET /calendar/integration-status-v2` - Calendar integration
- `GET /calendar/connections-with-deleted-calendars` - Calendar connections

### Forms & Surveys
- `GET /forms/hTQ3RdIWEVwnz6gHIzS3` - Form data
- `POST /forms/form-survey-event` - Form events

### Integrations
- `GET /integration/google-integration-status` - Google integration
- `GET /integration/fb-integration-status` - Facebook integration
- `GET /social-planner/integration-status` - Social planner
- `GET /yext/setup` - Yext setup
- `GET /whatsapp/whatsapp-banners` - WhatsApp integration

### Communication
- `GET /email-isv/sms-blocked-status` - SMS status
- `GET /email-isv/email-blocked-status` - Email status
- `GET /lc-phone/incoming-call-status` - Phone status
- `GET /yrMl7UtmMqo31qLMP76W/dialer` - Dialer settings

### Business Tools
- `GET /workflows/unpublished` - Workflow management
- `GET /customFields/search` - Custom fields
- `GET /objects/` - Object management
- `GET /customValues/` - Custom values
- `GET /custom-menus/` - Custom menus
- `GET /featureFlags/` - Feature flags
- `GET /tax/taxjar-deprecation-notification` - Tax notifications

### Billing & Subscriptions
- `GET /billing/implementation-modal-count` - Billing info
- `GET /plan/location` - Plan details
- `GET /reselling/subscription` - Reselling subscription

### Activity & Notifications
- `GET /notification/` - Notifications
- `PUT /3MF7Qje6BuQlkuO9gSs5/userActivity` - User activity
- `GET /yrMl7UtmMqo31qLMP76W/Prospecting` - Prospecting data

### Domains & Settings
- `GET /domain/` - Domain management
- `GET /Iir19ybG4Qtx9tEgJiX6/domainPurchase` - Domain purchase
- `GET /yrMl7UtmMqo31qLMP76W/domainPurchase` - Domain purchase
- `GET /redirect/regex` - Redirect rules
- `GET /whitelabel/Iir19ybG4Qtx9tEgJiX6` - Whitelabel settings

### Builder & Templates
- `GET /builder/section-data` - Builder sections
- `GET /builder/section-template` - Section templates
- `GET /builder/prebuilt-section` - Prebuilt sections
- `GET /hero/hero` - Hero sections
- `GET /countdown-timer/` - Countdown timers

### Miscellaneous
- `GET /scope/check` - Scope validation
- `GET /oauth/sidenav-custom-pages` - Custom pages
- `GET /affiliate-portal/Iir19ybG4Qtx9tEgJiX6` - Affiliate portal
- `GET /funnel-share-details/Khu05zZF68u4Ka2ZFdUC` - Funnel sharing
- `GET /COMPANY/Iir19ybG4Qtx9tEgJiX6` - Company data
- `GET /Iir19ybG4Qtx9tEgJiX6/conversationAI` - Conversation AI
- `GET /3MF7Qje6BuQlkuO9gSs5/CP_BRANDED_APP_49` - Branded app
- `GET /yrMl7UtmMqo31qLMP76W/CP_BRANDED_APP_49` - Branded app
- `GET /yrMl7UtmMqo31qLMP76W/default` - Default settings
- `GET /yrMl7UtmMqo31qLMP76W/all` - All settings
- `GET /fetch/Khu05zZF68u4Ka2ZFdUC` - Fetch data
- `GET /data/yJ5TfQYHOxxy14Po2ari` - Data endpoint
- `POST /changelog/getNewEntryIDs` - Changelog
- `POST /set/status` - Status setting

## Base URLs Observed

### Primary API
- `https://backend.leadconnectorhq.com` - Main backend API

### Specialized Services
- `https://page-builder.leadconnectorhq.com` - Page builder service
- `https://apisystem.tech` - External API system
- `https://stcdn.leadconnectorhq.com` - Static content CDN

## Token Refresh Mechanism

### Automatic Refresh
- **Endpoint**: `POST /appengine/api/token/update`
- **Method**: POST with current token in body or headers
- **Headers**: `token-id` or `Authorization: Bearer`
- **Response**: New JWT token

### Alternative Refresh
- **Endpoint**: `POST /signin/refresh`
- **Headers**: JWT token in `token-id` header
- **Response**: Refreshed authentication

## Implementation Notes

### For API Scripts:
1. **Primary Auth**: Use `token-id` header with JWT token
2. **Fallback**: Try `Authorization: Bearer {token}` for shorter tokens
3. **Version Header**: Still unresolved - all tested values (1, 2, latest) fail
4. **Additional Headers**: Include `baggage`, `channel`, `sentry-trace`, `source` when needed
5. **Token refresh**: Call refresh endpoints on 401 errors

### Error Handling:
- **401 Unauthorized**: Token expired or invalid version header
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Endpoint doesn't exist or wrong IDs

### Rate Limiting:
- Monitor response headers for rate limit information
- Implement exponential backoff on failures

## Code Examples

### Basic API Call (Current Issue):
```javascript
const headers = {
  'token-id': process.env.GHL_SESSION_TOKEN,
  'version': '2', // This causes "version header is invalid"
  'Content-Type': 'application/json',
  'baggage': 'sentry-environment=production,sentry-release=f6e0d...',
  'channel': 'channel_value',
  'sentry-trace': 'trace_value',
  'source': 'source_value'
};

const response = await axios.get('/users/2XCxWZuZmB6oyQoi83X9', { headers });
```

### Token Refresh:
```javascript
async function refreshToken(currentToken) {
  // Method 1: token-id header
  const response1 = await axios.post('/appengine/api/token/update', {}, {
    headers: {
      'token-id': currentToken,
      'version': '2'
    }
  });

  // Method 2: Bearer token
  const response2 = await axios.post('/signin/refresh', {}, {
    headers: {
      'Authorization': `Bearer ${currentToken}`,
      'version': '2'
    }
  });

  return response1.data.token || response2.data.token;
}
```

## Testing Strategy

1. **Test different version header formats** (integer vs string)
2. **Try omitting version header entirely**
3. **Test with different header combinations**
4. **Monitor network capture for exact header format**
5. **Test token refresh mechanisms**

## Token Expiration & Refresh

### Current Status
- **Token Valid**: Current token expires 2025-10-21T23:01:48Z (~16 minutes remaining)
- **Last Updated**: 2025-10-21T22:01:48Z
- **Status**: Valid but version header blocking API calls

### Token Refresh Process
1. **Automatic Refresh**: Call `POST /appengine/api/token/update` with current token
2. **Manual Refresh**: Login again to get fresh token
3. **Detection**: Monitor for 401 responses

### Getting Fresh Tokens
1. Run token extraction: `npm run extract-tokens`
2. Login to GoHighLevel admin
3. Wait for login to complete
4. Press Ctrl+C to capture new tokens
5. Update `.env` file with new `GHL_SESSION_TOKEN`

### Token Lifespan
- **Typical Duration**: ~1 hour (based on iat/exp difference)
- **Refresh Window**: Call refresh endpoint before expiry
- **Storage**: Update `.env` file when tokens change

## Version Header Investigation

### Failed Attempts:
- `version: "1"` - "version header is invalid"
- `version: "2"` - "version header is invalid"
- `version: "latest"` - "version header is invalid"
- `version: 1` (integer) - "version header is invalid"
- `version: 2` (integer) - "version header is invalid"

### Next Steps:
1. **Inspect exact headers** from successful network calls
2. **Try version as different data types** (boolean, object)
3. **Check for version in different header names**
4. **Test without version header** (might be optional)
5. **Look for version in request body** instead of headers