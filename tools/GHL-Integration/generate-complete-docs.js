#!/usr/bin/env node

/**
 * GHL API Documentation Generator
 * Generates comprehensive API documentation, sample code, and test utilities
 * from observed patterns and discovered endpoints
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'api-documentation');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// KNOWN GHL API ENDPOINTS (from admin console observations)
// ============================================================================

const ADMIN_CONSOLE_ENDPOINTS = [
  {
    method: 'GET',
    endpoint: '/users/me',
    name: 'Get Current User',
    auth: 'token-id',
    description: 'Fetch current authenticated user information'
  },
  {
    method: 'GET',
    endpoint: '/users/{userId}',
    name: 'Get User by ID',
    auth: 'token-id',
    description: 'Fetch specific user by ID'
  },
  {
    method: 'GET',
    endpoint: '/location',
    name: 'Get Default Location',
    auth: 'token-id',
    description: 'Fetch default/primary location'
  },
  {
    method: 'GET',
    endpoint: '/location/{id}',
    name: 'Get Location',
    auth: 'token-id',
    description: 'Fetch location by ID'
  },
  {
    method: 'GET',
    endpoint: '/locations',
    name: 'List Locations',
    auth: 'token-id',
    description: 'List all locations for user'
  },
  {
    method: 'GET',
    endpoint: '/contact',
    name: 'List Contacts',
    auth: 'token-id',
    description: 'List all contacts'
  },
  {
    method: 'GET',
    endpoint: '/contact/{id}',
    name: 'Get Contact',
    auth: 'token-id',
    description: 'Get contact by ID'
  },
  {
    method: 'POST',
    endpoint: '/contact',
    name: 'Create Contact',
    auth: 'token-id',
    description: 'Create new contact',
    body: { firstName: 'string', lastName: 'string', email: 'string' }
  },
  {
    method: 'PUT',
    endpoint: '/contact/{id}',
    name: 'Update Contact',
    auth: 'token-id',
    description: 'Update existing contact'
  },
  {
    method: 'GET',
    endpoint: '/opportunity',
    name: 'List Opportunities',
    auth: 'token-id',
    description: 'List all opportunities/deals'
  },
  {
    method: 'GET',
    endpoint: '/opportunity/{id}',
    name: 'Get Opportunity',
    auth: 'token-id',
    description: 'Get opportunity by ID'
  },
  {
    method: 'POST',
    endpoint: '/opportunity',
    name: 'Create Opportunity',
    auth: 'token-id',
    description: 'Create new opportunity'
  },
  {
    method: 'GET',
    endpoint: '/campaign',
    name: 'Get Campaign',
    auth: 'token-id',
    description: 'Get campaign information'
  },
  {
    method: 'GET',
    endpoint: '/campaigns',
    name: 'List Campaigns',
    auth: 'token-id',
    description: 'List all campaigns'
  },
  {
    method: 'POST',
    endpoint: '/campaigns',
    name: 'Create Campaign',
    auth: 'token-id',
    description: 'Create new campaign'
  },
  {
    method: 'GET',
    endpoint: '/funnel',
    name: 'List Funnels',
    auth: 'token-id',
    description: 'List all funnels/automations'
  },
  {
    method: 'GET',
    endpoint: '/page',
    name: 'List Pages',
    auth: 'token-id',
    description: 'List all landing pages'
  },
  {
    method: 'GET',
    endpoint: '/page/{id}',
    name: 'Get Page',
    auth: 'token-id',
    description: 'Get page by ID'
  },
  {
    method: 'POST',
    endpoint: '/page',
    name: 'Create Page',
    auth: 'token-id',
    description: 'Create new landing page'
  },
  {
    method: 'PUT',
    endpoint: '/page/{id}',
    name: 'Update Page',
    auth: 'token-id',
    description: 'Update page'
  },
  {
    method: 'POST',
    endpoint: '/page/{id}/publish',
    name: 'Publish Page',
    auth: 'token-id',
    description: 'Publish page to live'
  },
  {
    method: 'DELETE',
    endpoint: '/page/{id}',
    name: 'Delete Page',
    auth: 'token-id',
    description: 'Delete page'
  },
  {
    method: 'GET',
    endpoint: '/webhook',
    name: 'List Webhooks',
    auth: 'token-id',
    description: 'List all webhooks'
  },
  {
    method: 'POST',
    endpoint: '/webhook',
    name: 'Create Webhook',
    auth: 'token-id',
    description: 'Create new webhook'
  },
  {
    method: 'DELETE',
    endpoint: '/webhook/{id}',
    name: 'Delete Webhook',
    auth: 'token-id',
    description: 'Delete webhook'
  }
];

// ============================================================================
// KNOWN AUTHENTICATION PATTERNS
// ============================================================================

const AUTH_PATTERNS = {
  'token-id': {
    header: 'token-id',
    format: 'JWT Token',
    algorithm: 'HS256 or RS256',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    usage: 'Primary authentication method for most endpoints'
  },
  'bearer': {
    header: 'Authorization',
    format: 'Bearer {token}',
    algorithm: 'HS256 or RS256',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    usage: 'Fallback/alternative authentication method'
  }
};

// ============================================================================
// KNOWN HEADER PATTERNS
// ============================================================================

const HEADER_PATTERNS = {
  'token-id': {
    required: true,
    description: 'Authentication token',
    pattern: 'JWT token string',
    examples: ['eyJhbGc...']
  },
  'version': {
    required: true,
    description: 'API version',
    pattern: 'Numeric string or semantic version',
    examples: ['1', '1.0', '2.0'],
    note: 'Often just "1" or "1.0" - the one causing validation errors'
  },
  'content-type': {
    required: true,
    description: 'Content type for requests with body',
    pattern: 'application/json',
    examples: ['application/json']
  },
  'accept': {
    required: false,
    description: 'Accepted response format',
    pattern: 'application/json',
    examples: ['application/json']
  },
  'authorization': {
    required: false,
    description: 'Alternative auth header',
    pattern: 'Bearer {token} or other schemes',
    examples: ['Bearer eyJhbGc...']
  },
  'channel': {
    required: false,
    description: 'Channel identifier',
    pattern: 'string',
    examples: ['web', 'mobile', 'api']
  },
  'source': {
    required: false,
    description: 'Request source identifier',
    pattern: 'string',
    examples: ['dashboard', 'api-client', 'mobile-app']
  },
  'user-agent': {
    required: false,
    description: 'User agent string',
    pattern: 'string',
    examples: ['GHL-API-Client/1.0', 'Mozilla/5.0...']
  }
};

// ============================================================================
// BASE URLS
// ============================================================================

const BASE_URLS = {
  'backend': 'https://backend.leadconnectorhq.com',
  'locationapi': 'https://locationapi.leadconnectorhq.com',
  'pagebuilder': 'https://page-builder.leadconnectorhq.com',
  'apisystem': 'https://apisystem.tech'
};

// ============================================================================
// GENERATE DOCUMENTATION FILES
// ============================================================================

function generateEndpointRegistry() {
  const registry = {
    generatedAt: new Date().toISOString(),
    baseUrls: BASE_URLS,
    totalEndpoints: ADMIN_CONSOLE_ENDPOINTS.length,
    endpoints: ADMIN_CONSOLE_ENDPOINTS.map(ep => ({
      ...ep,
      fullUrl: `${BASE_URLS.backend}${ep.endpoint}`,
      requiredHeaders: ['token-id', 'version', 'content-type'],
      example: generateCurlExample(ep),
      javascriptExample: generateJSExample(ep)
    }))
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '1-Endpoint-Registry.json'),
    JSON.stringify(registry, null, 2)
  );
  console.log('✅ 1-Endpoint-Registry.json');
}

function generateAuthenticationPatterns() {
  const patterns = {
    generatedAt: new Date().toISOString(),
    summary: {
      primaryMethod: 'token-id header',
      fallbackMethod: 'Authorization Bearer header',
      tokenFormat: 'JWT (JSON Web Token)',
      tokenAlgorithms: ['HS256', 'RS256']
    },
    patterns: AUTH_PATTERNS,
    implementationSteps: [
      '1. Authenticate to get token-id',
      '2. Include token-id header in all requests',
      '3. Include version header (usually "1.0")',
      '4. If 401 response, token may be expired - refresh',
      '5. Some endpoints may accept Bearer token as alternative'
    ]
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '2-Authentication-Patterns.json'),
    JSON.stringify(patterns, null, 2)
  );
  console.log('✅ 2-Authentication-Patterns.json');
}

function generateHeaderPatterns() {
  const patterns = {
    generatedAt: new Date().toISOString(),
    critical: {
      'token-id': HEADER_PATTERNS['token-id'],
      'version': HEADER_PATTERNS['version'],
      'content-type': HEADER_PATTERNS['content-type']
    },
    optional: {
      'authorization': HEADER_PATTERNS['authorization'],
      'channel': HEADER_PATTERNS['channel'],
      'source': HEADER_PATTERNS['source'],
      'user-agent': HEADER_PATTERNS['user-agent']
    },
    standardHeaders: HEADER_PATTERNS,
    versionHeaderNote: 'The "version" header often causes validation errors. Try: "1", "1.0", "2", "2.0"'
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '3-Header-Patterns.json'),
    JSON.stringify(patterns, null, 2)
  );
  console.log('✅ 3-Header-Patterns.json');
}

function generateSampleClient() {
  const code = `/**
 * GHL API Client v2
 * Comprehensive client for interacting with GoHighLevel API
 * 
 * Generated: ${new Date().toISOString()}
 * Total Endpoints: ${ADMIN_CONSOLE_ENDPOINTS.length}
 */

class GHLAPIClient {
  /**
   * Initialize GHL API Client
   * @param {string} tokenId - Your token-id from GHL authentication
   * @param {object} options - Configuration options
   */
  constructor(tokenId, options = {}) {
    this.tokenId = tokenId;
    this.baseUrl = options.baseUrl || '${BASE_URLS.backend}';
    this.version = options.version || '1.0';
    this.timeout = options.timeout || 30000;
  }

  /**
   * Make HTTP request with proper headers
   * @private
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = new URL(endpoint, this.baseUrl).href;
    
    const headers = {
      'token-id': this.tokenId,
      'version': this.version,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    const config = {
      method,
      headers,
      timeout: this.timeout
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        throw new Error('Authentication failed - token may be expired');
      }
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(\`API Error [\${response.status}]: \${errorBody}\`);
      }

      return await response.json();
    } catch (error) {
      console.error(\`Request failed: \${error.message}\`);
      throw error;
    }
  }

  // ========== USER ENDPOINTS ==========

  /**
   * Get current authenticated user
   * @returns {Promise} User object
   */
  async getCurrentUser() {
    return this.request('GET', '/users/me');
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise} User object
   */
  async getUser(userId) {
    return this.request('GET', \`/users/\${userId}\`);
  }

  // ========== LOCATION ENDPOINTS ==========

  /**
   * Get default location
   * @returns {Promise} Location object
   */
  async getLocation() {
    return this.request('GET', '/location');
  }

  /**
   * Get location by ID
   * @param {string} locationId - Location ID
   * @returns {Promise} Location object
   */
  async getLocationById(locationId) {
    return this.request('GET', \`/location/\${locationId}\`);
  }

  /**
   * List all locations
   * @returns {Promise} Array of locations
   */
  async listLocations() {
    return this.request('GET', '/locations');
  }

  // ========== CONTACT ENDPOINTS ==========

  /**
   * List all contacts
   * @param {object} params - Query parameters (limit, skip, etc.)
   * @returns {Promise} Array of contacts
   */
  async listContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = \`/contact?\${query}\`;
    return this.request('GET', endpoint);
  }

  /**
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Promise} Contact object
   */
  async getContact(contactId) {
    return this.request('GET', \`/contact/\${contactId}\`);
  }

  /**
   * Create new contact
   * @param {object} contactData - Contact information
   * @returns {Promise} Created contact object
   */
  async createContact(contactData) {
    return this.request('POST', '/contact', contactData);
  }

  /**
   * Update contact
   * @param {string} contactId - Contact ID
   * @param {object} updateData - Data to update
   * @returns {Promise} Updated contact object
   */
  async updateContact(contactId, updateData) {
    return this.request('PUT', \`/contact/\${contactId}\`, updateData);
  }

  // ========== PAGE ENDPOINTS ==========

  /**
   * List all landing pages
   * @returns {Promise} Array of pages
   */
  async listPages() {
    return this.request('GET', '/page');
  }

  /**
   * Get page by ID
   * @param {string} pageId - Page ID
   * @returns {Promise} Page object
   */
  async getPage(pageId) {
    return this.request('GET', \`/page/\${pageId}\`);
  }

  /**
   * Create new page
   * @param {object} pageData - Page configuration
   * @returns {Promise} Created page object
   */
  async createPage(pageData) {
    return this.request('POST', '/page', pageData);
  }

  /**
   * Update page
   * @param {string} pageId - Page ID
   * @param {object} updateData - Data to update
   * @returns {Promise} Updated page object
   */
  async updatePage(pageId, updateData) {
    return this.request('PUT', \`/page/\${pageId}\`, updateData);
  }

  /**
   * Publish page to live
   * @param {string} pageId - Page ID
   * @returns {Promise} Response
   */
  async publishPage(pageId) {
    return this.request('POST', \`/page/\${pageId}/publish\`);
  }

  /**
   * Delete page
   * @param {string} pageId - Page ID
   * @returns {Promise} Response
   */
  async deletePage(pageId) {
    return this.request('DELETE', \`/page/\${pageId}\`);
  }

  // ========== OPPORTUNITY ENDPOINTS ==========

  /**
   * List opportunities/deals
   * @returns {Promise} Array of opportunities
   */
  async listOpportunities() {
    return this.request('GET', '/opportunity');
  }

  /**
   * Get opportunity by ID
   * @param {string} opportunityId - Opportunity ID
   * @returns {Promise} Opportunity object
   */
  async getOpportunity(opportunityId) {
    return this.request('GET', \`/opportunity/\${opportunityId}\`);
  }

  /**
   * Create opportunity
   * @param {object} opportunityData - Opportunity data
   * @returns {Promise} Created opportunity object
   */
  async createOpportunity(opportunityData) {
    return this.request('POST', '/opportunity', opportunityData);
  }

  // ========== CAMPAIGN ENDPOINTS ==========

  /**
   * List campaigns
   * @returns {Promise} Array of campaigns
   */
  async listCampaigns() {
    return this.request('GET', '/campaigns');
  }

  /**
   * Get campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Promise} Campaign object
   */
  async getCampaign(campaignId) {
    return this.request('GET', \`/campaign\`);
  }

  /**
   * Create campaign
   * @param {object} campaignData - Campaign data
   * @returns {Promise} Created campaign object
   */
  async createCampaign(campaignData) {
    return this.request('POST', '/campaigns', campaignData);
  }

  // ========== FUNNEL ENDPOINTS ==========

  /**
   * List funnels/automations
   * @returns {Promise} Array of funnels
   */
  async listFunnels() {
    return this.request('GET', '/funnel');
  }

  // ========== WEBHOOK ENDPOINTS ==========

  /**
   * List webhooks
   * @returns {Promise} Array of webhooks
   */
  async listWebhooks() {
    return this.request('GET', '/webhook');
  }

  /**
   * Create webhook
   * @param {object} webhookData - Webhook configuration
   * @returns {Promise} Created webhook object
   */
  async createWebhook(webhookData) {
    return this.request('POST', '/webhook', webhookData);
  }

  /**
   * Delete webhook
   * @param {string} webhookId - Webhook ID
   * @returns {Promise} Response
   */
  async deleteWebhook(webhookId) {
    return this.request('DELETE', \`/webhook/\${webhookId}\`);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GHLAPIClient;
}
`;

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '4-Sample-API-Client.js'),
    code
  );
  console.log('✅ 4-Sample-API-Client.js');
}

function generateCurlExamples() {
  let examples = '# GHL API - cURL Examples\n\n';
  examples += `Generated: ${new Date().toISOString()}\n\n`;

  examples += '## Authentication Setup\n\n';
  examples += '```bash\n';
  examples += '# Store your token and version\n';
  examples += 'TOKEN_ID="your-token-id-here"\n';
  examples += 'VERSION="1.0"\n';
  examples += 'BASE_URL="https://backend.leadconnectorhq.com"\n';
  examples += '```\n\n';

  examples += '## User Endpoints\n\n';
  examples += generateCurlExample({ method: 'GET', endpoint: '/users/me', name: 'Get Current User' });
  examples += generateCurlExample({ method: 'GET', endpoint: '/users/{userId}', name: 'Get User by ID' });

  examples += '## Location Endpoints\n\n';
  examples += generateCurlExample({ method: 'GET', endpoint: '/location', name: 'Get Default Location' });
  examples += generateCurlExample({ method: 'GET', endpoint: '/locations', name: 'List Locations' });

  examples += '## Contact Endpoints\n\n';
  examples += generateCurlExample({ method: 'GET', endpoint: '/contact', name: 'List Contacts' });
  examples += generateCurlExample({ method: 'GET', endpoint: '/contact/{id}', name: 'Get Contact' });
  examples += generateCurlExample({ method: 'POST', endpoint: '/contact', name: 'Create Contact' });
  examples += generateCurlExample({ method: 'PUT', endpoint: '/contact/{id}', name: 'Update Contact' });

  examples += '## Page Endpoints\n\n';
  examples += generateCurlExample({ method: 'GET', endpoint: '/page', name: 'List Pages' });
  examples += generateCurlExample({ method: 'GET', endpoint: '/page/{id}', name: 'Get Page' });
  examples += generateCurlExample({ method: 'POST', endpoint: '/page', name: 'Create Page' });
  examples += generateCurlExample({ method: 'POST', endpoint: '/page/{id}/publish', name: 'Publish Page' });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '5-cURL-Examples.sh'),
    examples
  );
  console.log('✅ 5-cURL-Examples.sh');
}

function generateCurlExample(endpoint) {
  let example = `### ${endpoint.name}\n\n`;
  example += '```bash\n';
  example += `curl -X ${endpoint.method} \\\n`;
  example += `  "$BASE_URL${endpoint.endpoint}" \\\n`;
  example += `  -H "token-id: $TOKEN_ID" \\\n`;
  example += `  -H "version: $VERSION" \\\n`;
  example += `  -H "Content-Type: application/json" \\\n`;
  example += `  -H "Accept: application/json"\n`;
  example += '```\n\n';
  return example;
}

function generateJSExample(endpoint) {
  return `
const client = new GHLAPIClient(tokenId);
const result = await client.${endpoint.name.toLowerCase().replace(/\\s+/g, '')};
`;
}

function generateComprehensiveGuide() {
  let guide = '# GHL API Complete Integration Guide\n\n';
  guide += `Generated: ${new Date().toISOString()}\n\n`;

  guide += '## 📋 Table of Contents\n\n';
  guide += '1. [Overview](#overview)\n';
  guide += '2. [Authentication](#authentication)\n';
  guide += '3. [Headers](#headers)\n';
  guide += '4. [Endpoints](#endpoints)\n';
  guide += '5. [Error Handling](#error-handling)\n';
  guide += '6. [Implementation Examples](#implementation-examples)\n\n';

  guide += '## Overview\n\n';
  guide += `- **Total Endpoints**: ${ADMIN_CONSOLE_ENDPOINTS.length}\n`;
  guide += `- **Primary Base URL**: ${BASE_URLS.backend}\n`;
  guide += '- **Authentication**: Token-based (JWT)\n';
  guide += '- **Response Format**: JSON\n\n';

  guide += '## Authentication\n\n';
  guide += '### Token-ID Header Method (Primary)\n\n';
  guide += 'All API calls require authentication via the `token-id` header:\n\n';
  guide += '```bash\ncurl -H "token-id: YOUR_TOKEN_HERE" ...\n```\n\n';
  guide += '### Bearer Token Method (Alternative)\n\n';
  guide += 'Some endpoints also accept Bearer token:\n\n';
  guide += '```bash\ncurl -H "Authorization: Bearer YOUR_TOKEN_HERE" ...\n```\n\n';

  guide += '## Headers\n\n';
  guide += '### Required Headers\n\n';
  guide += '| Header | Value | Purpose |\n';
  guide += '|--------|-------|----------|\n';
  guide += '| `token-id` | JWT Token | Authentication |\n';
  guide += '| `version` | "1.0" or "1" | API Version |\n';
  guide += '| `Content-Type` | application/json | Request format |\n\n';

  guide += '### Optional Headers\n\n';
  guide += '| Header | Value | Purpose |\n';
  guide += '|--------|-------|----------|\n';
  guide += '| `Accept` | application/json | Response format |\n';
  guide += '| `Authorization` | Bearer {token} | Alternative auth |\n';
  guide += '| `Channel` | string | Channel identifier |\n\n';

  guide += '## Endpoints\n\n';
  guide += '### User Endpoints\n\n';
  guide += '- `GET /users/me` - Get current user\n';
  guide += '- `GET /users/{userId}` - Get user by ID\n\n';

  guide += '### Location Endpoints\n\n';
  guide += '- `GET /location` - Get default location\n';
  guide += '- `GET /location/{id}` - Get location by ID\n';
  guide += '- `GET /locations` - List all locations\n\n';

  guide += '### Contact Endpoints\n\n';
  guide += '- `GET /contact` - List contacts\n';
  guide += '- `GET /contact/{id}` - Get contact\n';
  guide += '- `POST /contact` - Create contact\n';
  guide += '- `PUT /contact/{id}` - Update contact\n\n';

  guide += '### Page Endpoints\n\n';
  guide += '- `GET /page` - List pages\n';
  guide += '- `GET /page/{id}` - Get page\n';
  guide += '- `POST /page` - Create page\n';
  guide += '- `PUT /page/{id}` - Update page\n';
  guide += '- `POST /page/{id}/publish` - Publish page\n';
  guide += '- `DELETE /page/{id}` - Delete page\n\n';

  guide += '## Error Handling\n\n';
  guide += '| Status | Meaning | Action |\n';
  guide += '|--------|---------|--------|\n';
  guide += '| 200 | Success | Use response data |\n';
  guide += '| 201 | Created | Resource created successfully |\n';
  guide += '| 400 | Bad Request | Check request format |\n';
  guide += '| 401 | Unauthorized | Token expired or invalid |\n';
  guide += '| 403 | Forbidden | Insufficient permissions |\n';
  guide += '| 404 | Not Found | Endpoint or resource not found |\n';
  guide += '| 500 | Server Error | Retry or contact support |\n\n';

  guide += '## Implementation Examples\n\n';
  guide += '### JavaScript/Node.js\n\n';
  guide += '```javascript\nconst GHLAPIClient = require("./4-Sample-API-Client.js");\nconst client = new GHLAPIClient(tokenId);\nconst user = await client.getCurrentUser();\nconsole.log(user);\n```\n\n';

  guide += '### Python\n\n';
  guide += '```python\nimport requests\n\nheaders = {\n    "token-id": token_id,\n    "version": "1.0",\n    "Content-Type": "application/json"\n}\n\nresponse = requests.get("https://backend.leadconnectorhq.com/users/me", headers=headers)\nprint(response.json())\n```\n\n';

  guide += '### PHP\n\n';
  guide += '```php\n$headers = [\n    "token-id" => $token_id,\n    "version" => "1.0",\n    "Content-Type" => "application/json"\n];\n\n$ch = curl_init("https://backend.leadconnectorhq.com/users/me");\ncurl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n$response = curl_exec($ch);\necho $response;\n```\n\n';

  guide += '## Generated Files\n\n';
  guide += '1. **1-Endpoint-Registry.json** - Complete endpoint catalog\n';
  guide += '2. **2-Authentication-Patterns.json** - Auth method documentation\n';
  guide += '3. **3-Header-Patterns.json** - Header requirements\n';
  guide += '4. **4-Sample-API-Client.js** - Ready-to-use JavaScript client\n';
  guide += '5. **5-cURL-Examples.sh** - cURL command examples\n';
  guide += '6. **Complete-API-Guide.md** - This file\n\n';

  guide += '## Next Steps\n\n';
  guide += '1. Review `1-Endpoint-Registry.json` for all available endpoints\n';
  guide += '2. Use `4-Sample-API-Client.js` as a template for your implementation\n';
  guide += '3. Test endpoints with `5-cURL-Examples.sh`\n';
  guide += '4. Update your application with discovered patterns\n';
  guide += '5. Remember: `version` header must be included in all requests\n';

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'Complete-API-Guide.md'),
    guide
  );
  console.log('✅ Complete-API-Guide.md');
}

function generateTestingScript() {
  const script = `#!/usr/bin/env node

/**
 * GHL API Testing Script
 * Test discovered endpoints to validate they work with your token
 */

const GHLAPIClient = require('./4-Sample-API-Client.js');

const TOKEN_ID = process.env.GHL_TOKEN || 'your-token-id-here';

async function runTests() {
  console.log('🧪 GHL API Testing Suite');
  console.log('🔑 Token: ' + TOKEN_ID.substring(0, 20) + '...');
  console.log('');

  const client = new GHLAPIClient(TOKEN_ID);

  const tests = [
    {
      name: 'Get Current User',
      fn: () => client.getCurrentUser()
    },
    {
      name: 'Get Location',
      fn: () => client.getLocation()
    },
    {
      name: 'List Contacts',
      fn: () => client.listContacts()
    },
    {
      name: 'List Pages',
      fn: () => client.listPages()
    },
    {
      name: 'List Campaigns',
      fn: () => client.listCampaigns()
    },
    {
      name: 'List Opportunities',
      fn: () => client.listOpportunities()
    }
  ];

  for (const test of tests) {
    try {
      console.log(\`⏳ Testing: \${test.name}...\`);
      const result = await test.fn();
      console.log(\`✅ \${test.name}\`);
      console.log(\`   Response: \${typeof result === 'object' ? JSON.stringify(result).substring(0, 100) : result}\`);
    } catch (error) {
      console.log(\`❌ \${test.name}\`);
      console.log(\`   Error: \${error.message}\`);
    }
  }

  console.log('');
  console.log('✅ Testing complete!');
}

runTests().catch(console.error);
`;

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '6-Test-Script.js'),
    script
  );
  fs.chmodSync(path.join(OUTPUT_DIR, '6-Test-Script.js'), 0o755);
  console.log('✅ 6-Test-Script.js');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('📚 GHL API Documentation Generator');
  console.log('===================================\n');

  console.log('Generating documentation files...\n');

  generateEndpointRegistry();
  generateAuthenticationPatterns();
  generateHeaderPatterns();
  generateSampleClient();
  generateCurlExamples();
  generateComprehensiveGuide();
  generateTestingScript();

  console.log('\n✅ Complete!\n');
  console.log(`📍 Output Directory: ${OUTPUT_DIR}`);
  console.log('\n📋 Generated Files:');
  console.log('  1. 1-Endpoint-Registry.json');
  console.log('  2. 2-Authentication-Patterns.json');
  console.log('  3. 3-Header-Patterns.json');
  console.log('  4. 4-Sample-API-Client.js');
  console.log('  5. 5-cURL-Examples.sh');
  console.log('  6. 6-Test-Script.js');
  console.log('  7. Complete-API-Guide.md');
  console.log('\n🚀 Next Steps:');
  console.log('  1. Review Complete-API-Guide.md for full documentation');
  console.log('  2. Check 1-Endpoint-Registry.json for all endpoints');
  console.log('  3. Use 4-Sample-API-Client.js in your code');
  console.log('  4. Run: GHL_TOKEN="your-token" node 6-Test-Script.js');
  console.log('  5. Test with: bash 5-cURL-Examples.sh');
}

main();
