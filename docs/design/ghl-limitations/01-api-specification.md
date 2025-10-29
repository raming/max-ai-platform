# API Specification: GoHighLevel REST Endpoints

**Reference**: `/tools/GHL-Integration/api-documentation/1-Endpoint-Registry.json`  
**Status**: ✅ 25 endpoints documented  
**Last Updated**: 2025-10-24  
**Authentication**: token-id header (JWT format)  

---

## Quick Reference

### API Base URLs

| Service | Base URL |
|---------|----------|
| Backend API | `https://backend.leadconnectorhq.com` |
| Location API | `https://locationapi.leadconnectorhq.com` |
| Page Builder | `https://page-builder.leadconnectorhq.com` |
| API System | `https://apisystem.tech` |

### Required Headers (All Requests)

```javascript
{
  'token-id': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // JWT token
  'version': '1.0',                                        // API version
  'Content-Type': 'application/json'                       // POST/PUT only
}
```

### Response Headers (Important)

```
X-RateLimit-Limit: 300              # Max requests per window
X-RateLimit-Remaining: 299          # Requests left in window
X-RateLimit-Reset: 1698157872       # Unix timestamp of reset
```

---

## Endpoint Catalog

### User Management (2 endpoints)

#### GET /users/me
**Purpose**: Get current authenticated user  
**Method**: GET  
**Authentication**: token-id  
**Rate Limit**: Standard (counted)  
**Response**:
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "admin",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### GET /users/{userId}
**Purpose**: Get user by ID  
**Method**: GET  
**Parameters**: `userId` (path)  
**Authentication**: token-id  
**Response**: User object (same structure as GET /users/me)  

---

### Location Management (3 endpoints)

#### GET /location
**Purpose**: Get default/primary location  
**Method**: GET  
**Authentication**: token-id  
**Response**:
```json
{
  "id": "loc123",
  "name": "Main Location",
  "address": "123 Main St, City, State 12345",
  "phone": "+1-555-0100",
  "email": "location@example.com",
  "timezone": "America/Chicago",
  "settings": {
    "currency": "USD",
    "businessHours": "9AM-5PM CST"
  }
}
```

#### GET /location/{id}
**Purpose**: Get location by ID  
**Method**: GET  
**Parameters**: `id` (path - location ID)  
**Response**: Location object  

#### GET /locations
**Purpose**: List all locations for user  
**Method**: GET  
**Query Parameters**:
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response**:
```json
{
  "data": [
    { "id": "loc123", "name": "Location 1" },
    { "id": "loc456", "name": "Location 2" }
  ],
  "meta": {
    "total": 2,
    "limit": 50,
    "offset": 0
  }
}
```

---

### Contact Management (4 endpoints)

#### GET /contact
**Purpose**: List all contacts  
**Method**: GET  
**Query Parameters**:
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)
- `email` (optional - filter)
- `phone` (optional - filter)
- `tags` (optional - comma-separated filter)

**Rate Limit**: 1 request per query  
**Response**:
```json
{
  "data": [
    {
      "id": "contact123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "companyName": "Acme Corp",
      "tags": ["vip", "sales"],
      "source": "web_form",
      "assignedTo": "user456",
      "address": {
        "street": "123 Main St",
        "city": "City",
        "state": "ST",
        "postalCode": "12345",
        "country": "USA"
      },
      "customFields": {
        "industry": "Technology"
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T12:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /contact/{id}
**Purpose**: Get contact by ID  
**Method**: GET  
**Parameters**: `id` (path - contact ID)  
**Response**: Contact object (see GET /contact response format)  

#### POST /contact
**Purpose**: Create new contact  
**Method**: POST  
**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "companyName": "Acme Corp",
  "tags": ["vip"],
  "source": "api",
  "assignedTo": "user456",
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "ST",
    "postalCode": "12345"
  },
  "customFields": {
    "industry": "Technology"
  }
}
```

**Required Fields**: `firstName`, `lastName`, `email`  
**Response**: Created contact object (includes generated `id`)  
**Rate Limit**: 1 request = 1 contact created  

#### PUT /contact/{id}
**Purpose**: Update existing contact  
**Method**: PUT  
**Parameters**: `id` (path - contact ID)  
**Body**: Any contact fields (partial update supported)  
**Response**: Updated contact object  
**Rate Limit**: 1 request = 1 contact updated  

---

### Opportunity Management (3 endpoints)

#### GET /opportunity
**Purpose**: List all opportunities  
**Method**: GET  
**Query Parameters**:
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)
- `status` (optional - filter: "open", "won", "lost")

**Response**:
```json
{
  "data": [
    {
      "id": "opp123",
      "name": "Enterprise Deal",
      "contactId": "contact456",
      "value": 50000,
      "currency": "USD",
      "status": "negotiation",
      "stage": "proposal",
      "probability": 75,
      "expectedCloseDate": "2025-02-28",
      "assignedTo": "user789",
      "tags": ["priority"],
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T12:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /opportunity/{id}
**Purpose**: Get opportunity by ID  
**Method**: GET  
**Parameters**: `id` (path)  
**Response**: Opportunity object  

#### POST /opportunity
**Purpose**: Create new opportunity  
**Method**: POST  
**Body**:
```json
{
  "name": "Enterprise Deal",
  "contactId": "contact456",
  "value": 50000,
  "currency": "USD",
  "status": "open",
  "stage": "qualification",
  "expectedCloseDate": "2025-02-28",
  "assignedTo": "user789",
  "tags": ["priority"]
}
```

**Required Fields**: `name`, `contactId`, `value`, `status`  
**Response**: Created opportunity object  

#### PUT /opportunity/{id}
**Purpose**: Update opportunity  
**Method**: PUT  
**Parameters**: `id` (path)  
**Body**: Any opportunity fields (partial update)  
**Response**: Updated opportunity object  

---

### Campaign Management (3 endpoints)

#### GET /campaigns
**Purpose**: List all campaigns  
**Method**: GET  
**Query Parameters**:
- `limit` (optional)
- `offset` (optional)
- `status` (optional - "active", "paused", "archived")

**Response**: Array of campaign objects

#### GET /campaign (singular)
**Purpose**: Get single campaign  
**Method**: GET  
**Query Parameters**: `id` (required)  
**Response**: Single campaign object  

#### POST /campaigns
**Purpose**: Create new campaign  
**Method**: POST  
**Body**:
```json
{
  "name": "Email Campaign",
  "type": "email",
  "status": "draft",
  "template": "campaign_template_id"
}
```

**Response**: Created campaign object

---

### Page Management (5 endpoints)

#### GET /page
**Purpose**: List all pages  
**Method**: GET  
**Query Parameters**:
- `limit` (optional, default: 50)
- `offset` (optional)
- `status` (optional - "draft", "published", "archived")

**Response**:
```json
{
  "data": [
    {
      "id": "page123",
      "name": "Home Page",
      "slug": "home",
      "title": "Welcome to Acme",
      "description": "Our landing page",
      "status": "published",
      "url": "https://acme.example.com/home",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T12:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /page/{id}
**Purpose**: Get page by ID  
**Method**: GET  
**Parameters**: `id` (path)  
**Response**: Page object with full content  

#### POST /page
**Purpose**: Create new page  
**Method**: POST  
**Body**:
```json
{
  "name": "Contact Us",
  "slug": "contact",
  "title": "Contact Our Team",
  "description": "Get in touch with us",
  "content": "<h1>Contact Us</h1>...",
  "seoTitle": "Contact Acme Corp",
  "seoDescription": "Contact our team for more information",
  "seoKeywords": ["contact", "support"]
}
```

**Required Fields**: `name`, `slug`  
**Response**: Created page object  

#### PUT /page/{id}
**Purpose**: Update page  
**Method**: PUT  
**Parameters**: `id` (path)  
**Body**: Any page fields  
**Response**: Updated page object  
**Note**: Page must be draft status to update (or use POST with same slug)  

#### DELETE /page/{id}
**Purpose**: Delete page  
**Method**: DELETE  
**Parameters**: `id` (path)  
**Response**: Confirmation message  
**Note**: Only unpublished pages can be deleted  

#### POST /page/{id}/publish
**Purpose**: Publish page  
**Method**: POST  
**Parameters**: `id` (path)  
**Body**: (empty)  
**Response**: Updated page object with status="published"  
**Note**: Makes page live and accessible via slug URL  

---

### Funnel Management (1 endpoint)

#### GET /funnel
**Purpose**: List all funnels  
**Method**: GET  
**Query Parameters**:
- `limit` (optional)
- `offset` (optional)

**Response**:
```json
{
  "data": [
    {
      "id": "funnel123",
      "name": "Sales Funnel",
      "type": "sales",
      "pages": [
        { "id": "page1", "name": "Landing Page", "order": 1 },
        { "id": "page2", "name": "Sales Page", "order": 2 }
      ],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

**Note**: No create/update endpoint documented. Use GHL UI for funnel management.

---

### Webhook Management (3 endpoints)

#### GET /webhook
**Purpose**: List all webhooks  
**Method**: GET  
**Response**:
```json
{
  "data": [
    {
      "id": "webhook123",
      "url": "https://example.com/webhook",
      "events": ["contact.created", "contact.updated"],
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

#### POST /webhook
**Purpose**: Create new webhook  
**Method**: POST  
**Body**:
```json
{
  "url": "https://example.com/webhook",
  "events": ["contact.created", "contact.updated", "opportunity.created"],
  "secret": "optional_signing_secret"
}
```

**Required Fields**: `url`, `events` (array)  
**Response**: Created webhook object with `id`  

#### DELETE /webhook/{id}
**Purpose**: Delete webhook  
**Method**: DELETE  
**Parameters**: `id` (path)  
**Response**: Confirmation message  

---

## Authentication Details

### Token Acquisition Flow

```
1. User Login
   POST https://app.gohighlevel.com/login
   Body: { email, password }

2. OAuth Exchange
   (Handled by browser/OAuth provider)

3. Token Storage
   localStorage.setItem('ghl_token', token_value)

4. Use in API
   Headers: { 'token-id': token_value, 'version': '1.0' }
```

### Token Refresh

**When**: Automatically on HTTP 401 response  
**Endpoint**: `POST /token/update`  
**Body**: (empty - uses current token from header)  
**Response**: 
```json
{
  "tokenId": "new_jwt_token_value",
  "expiresIn": 1200  // seconds
}
```

**Implementation**:
```javascript
async function makeRequest(method, endpoint, data) {
  let response = await fetch(baseUrl + endpoint, {
    method,
    headers: getHeaders(currentToken),
    body: JSON.stringify(data)
  });

  if (response.status === 401) {
    // Token expired, refresh
    currentToken = await refreshToken();
    
    // Retry request with new token
    response = await fetch(baseUrl + endpoint, {
      method,
      headers: getHeaders(currentToken),
      body: JSON.stringify(data)
    });
  }

  return response.json();
}
```

---

## Rate Limiting Details

### Limits Discovered

- **Global Limit**: ~300 requests per time window
- **Time Window**: Length not precisely documented (likely 1 minute or 1 hour)
- **Burst Capacity**: Unknown
- **Per-Endpoint Limits**: Likely vary by resource intensity

### Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response normally |
| 201 | Created | Resource created successfully |
| 204 | No Content | Success but no response body |
| 400 | Bad Request | Check request format/headers |
| 401 | Unauthorized | Refresh token and retry |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check endpoint URL |
| 429 | Too Many Requests | Rate limited - back off |
| 500 | Server Error | Retry with exponential backoff |

### Rate Limit Handling

```javascript
class RateLimitManager {
  constructor(requestsPerWindow = 300) {
    this.requestsPerWindow = requestsPerWindow;
    this.windowStart = Date.now();
    this.requestCount = 0;
    this.windowDuration = 60000; // 1 minute (adjust based on testing)
  }

  async executeRequest(fn) {
    // Check if window reset
    if (Date.now() - this.windowStart > this.windowDuration) {
      this.windowStart = Date.now();
      this.requestCount = 0;
    }

    // If at limit, wait for window reset
    if (this.requestCount >= this.requestsPerWindow) {
      const waitTime = this.windowStart + this.windowDuration - Date.now();
      console.log(`Rate limited. Waiting ${waitTime}ms for window reset...`);
      await sleep(waitTime + 100); // +100ms buffer
      this.windowStart = Date.now();
      this.requestCount = 0;
    }

    this.requestCount++;
    return fn();
  }

  async executeWithBackoff(fn, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.executeRequest(fn);
      } catch (error) {
        if (error.status === 429) {
          // Rate limited
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Rate limited. Backing off for ${backoffMs}ms`);
          await sleep(backoffMs);
        } else {
          throw error;
        }
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Error Handling

### Common Errors

#### 400 Bad Request
**Cause**: Missing required header or invalid data format  
**Solution**:
```javascript
// ❌ Wrong
headers: { 'token-id': token } // Missing version!

// ✅ Correct
headers: {
  'token-id': token,
  'version': '1.0',
  'Content-Type': 'application/json'
}
```

#### 401 Unauthorized
**Cause**: Token expired or invalid  
**Solution**:
```javascript
if (response.status === 401) {
  const newToken = await refreshToken();
  updateAuthHeader('token-id', newToken);
  return retryRequest();
}
```

#### 404 Not Found
**Cause**: Wrong endpoint path  
**Solution**: Check `1-Endpoint-Registry.json` for correct path structure

#### 429 Too Many Requests
**Cause**: Rate limit exceeded  
**Solution**:
```javascript
const retryAfter = response.headers['Retry-After'];
await sleep(retryAfter * 1000);
return retryRequest();
```

---

## Data Models

### Contact Model

```typescript
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  tags?: string[];
  source?: string;
  assignedTo?: string; // user ID
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  customFields?: Record<string, any>;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Opportunity Model

```typescript
interface Opportunity {
  id: string;
  name: string;
  contactId: string;
  value: number;
  currency: string;
  status: 'open' | 'negotiation' | 'won' | 'lost';
  stage: string;
  probability: number; // 0-100
  expectedCloseDate?: string; // ISO 8601
  assignedTo?: string; // user ID
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Page Model

```typescript
interface Page {
  id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string;
  content?: string;
  status: 'draft' | 'published' | 'archived';
  url?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Testing with cURL

### Setup
```bash
export TOKEN_ID="your-token-id-here"
export VERSION="1.0"
export BASE_URL="https://backend.leadconnectorhq.com"
```

### Get Current User
```bash
curl -X GET "$BASE_URL/users/me" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json"
```

### List Contacts
```bash
curl -X GET "$BASE_URL/contact?limit=10" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION"
```

### Create Contact
```bash
curl -X POST "$BASE_URL/contact" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'
```

### Update Contact
```bash
curl -X PUT "$BASE_URL/contact/contact123" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+1-555-0100" }'
```

---

## Implementation Notes

### Pagination

- **Default limit**: 50
- **Max limit**: 100 (usually)
- **Offset-based**: Use `offset` to iterate
- **Recommended**: Implement cursor-based for large datasets

### Filtering

Limited built-in filters. For complex queries:
- Fetch all records (paginated)
- Filter in application layer
- Consider caching to reduce API calls

### Updates

All update endpoints support partial updates:
```javascript
// Only update phone
PUT /contact/123 { "phone": "+1-555-0100" }
// Other fields unchanged
```

### Batch Operations

**Not supported** - must loop through items:
```javascript
for (const contact of contactsArray) {
  await createContact(contact);
  // Remember: rate limit = 300/window
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-24 | Initial documentation from endpoint registry |

---

**Status**: ✅ Complete  
**Coverage**: 25 endpoints documented  
**Last Verified**: 2025-10-21 (via reference code)

