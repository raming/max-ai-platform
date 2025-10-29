#!/usr/bin/env node

/**
 * GHL API Discovery & Testing Tool
 * Records all API responses and generates sample code and documentation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, 'api-documentation');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sample token from previous extraction
const TOKEN = process.env.GHL_TOKEN || 'your-token-id-here';

const discoveredAPIs = [];
const successfulEndpoints = [];
const failedEndpoints = [];
const authPatterns = new Map();
const headerPatterns = new Map();

// Common GHL endpoints based on admin console observation
const ENDPOINTS_TO_TEST = [
  // Users & Auth
  { method: 'GET', path: '/users/me', name: 'Get current user' },
  { method: 'GET', path: '/users', name: 'List users' },
  { method: 'POST', path: '/signin', name: 'Sign in' },
  { method: 'POST', path: '/token/refresh', name: 'Refresh token' },
  
  // Locations
  { method: 'GET', path: '/location', name: 'Get locations' },
  { method: 'GET', path: '/location/{id}', name: 'Get location by ID' },
  { method: 'GET', path: '/locations', name: 'List all locations' },
  
  // Contacts & Leads
  { method: 'GET', path: '/contact', name: 'List contacts' },
  { method: 'GET', path: '/contact/{id}', name: 'Get contact by ID' },
  { method: 'POST', path: '/contact', name: 'Create contact' },
  { method: 'PUT', path: '/contact/{id}', name: 'Update contact' },
  { method: 'GET', path: '/leads', name: 'List leads' },
  
  // Opportunities/Deals
  { method: 'GET', path: '/opportunity', name: 'List opportunities' },
  { method: 'GET', path: '/opportunity/{id}', name: 'Get opportunity' },
  { method: 'POST', path: '/opportunity', name: 'Create opportunity' },
  
  // Campaigns
  { method: 'GET', path: '/campaigns', name: 'List campaigns' },
  { method: 'GET', path: '/campaigns/{id}', name: 'Get campaign' },
  { method: 'POST', path: '/campaigns', name: 'Create campaign' },
  { method: 'GET', path: '/campaign', name: 'Get campaign (v1)' },
  
  // Funnels/Automations
  { method: 'GET', path: '/funnel', name: 'List funnels' },
  { method: 'GET', path: '/funnel/{id}', name: 'Get funnel' },
  { method: 'GET', path: '/automation', name: 'List automations' },
  
  // Pages
  { method: 'GET', path: '/page', name: 'List pages' },
  { method: 'GET', path: '/page/{id}', name: 'Get page' },
  { method: 'POST', path: '/page', name: 'Create page' },
  { method: 'PUT', path: '/page/{id}', name: 'Update page' },
  { method: 'POST', path: '/page/{id}/publish', name: 'Publish page' },
  
  // Conversations/Messages
  { method: 'GET', path: '/conversation', name: 'List conversations' },
  { method: 'GET', path: '/message', name: 'List messages' },
  { method: 'POST', path: '/message', name: 'Send message' },
  
  // Webhooks
  { method: 'GET', path: '/webhook', name: 'List webhooks' },
  { method: 'POST', path: '/webhook', name: 'Create webhook' },
  { method: 'GET', path: '/webhook/{id}', name: 'Get webhook' },
  
  // Triggers & Actions
  { method: 'GET', path: '/trigger', name: 'List triggers' },
  { method: 'GET', path: '/action', name: 'List actions' },
  
  // Forms
  { method: 'GET', path: '/form', name: 'List forms' },
  { method: 'GET', path: '/form/{id}', name: 'Get form' },
  { method: 'POST', path: '/form', name: 'Create form' },
  
  // Workflow/Sequences
  { method: 'GET', path: '/workflow', name: 'List workflows' },
  { method: 'GET', path: '/sequence', name: 'List sequences' },
  
  // Analytics
  { method: 'GET', path: '/analytics', name: 'Get analytics' },
  { method: 'GET', path: '/report', name: 'Get reports' },
  
  // Settings
  { method: 'GET', path: '/settings', name: 'Get settings' },
  { method: 'PUT', path: '/settings', name: 'Update settings' },
  
  // Calendar/Appointments
  { method: 'GET', path: '/appointment', name: 'List appointments' },
  { method: 'POST', path: '/appointment', name: 'Create appointment' },
  
  // Tasks
  { method: 'GET', path: '/task', name: 'List tasks' },
  { method: 'POST', path: '/task', name: 'Create task' },
];

const BASE_URLS = [
  'https://backend.leadconnectorhq.com',
  'https://api.leadconnectorhq.com',
  'https://locationapi.leadconnectorhq.com'
];

function makeRequest(baseUrl, method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const options = {
      method,
      headers: {
        'token-id': TOKEN,
        'version': '1.0',
        'Content-Type': 'application/json',
        'User-Agent': 'GHL-API-Discovery/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const protocolHandler = url.protocol === 'https:' ? https : http;
    const req = protocolHandler.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? (body.startsWith('{') ? JSON.parse(body) : body) : null,
            endpoint: path,
            baseUrl,
            method,
            timestamp: new Date().toISOString()
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            endpoint: path,
            baseUrl,
            method,
            timestamp: new Date().toISOString(),
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testEndpoint(baseUrl, endpoint) {
  try {
    const response = await makeRequest(baseUrl, endpoint.method, endpoint.path);
    
    if (response.status < 400) {
      successfulEndpoints.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        baseUrl,
        name: endpoint.name,
        status: response.status,
        timestamp: response.timestamp
      });
      console.log(`✅ ${response.status} ${endpoint.method} ${endpoint.path}`);
    } else if (response.status === 401) {
      console.log(`🔐 ${response.status} ${endpoint.method} ${endpoint.path} (Auth needed)`);
    } else if (response.status === 404) {
      console.log(`❌ ${response.status} ${endpoint.method} ${endpoint.path} (Not found)`);
    } else {
      failedEndpoints.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        baseUrl,
        status: response.status
      });
      console.log(`⚠️  ${response.status} ${endpoint.method} ${endpoint.path}`);
    }
    
    discoveredAPIs.push(response);
    
  } catch (error) {
    console.log(`❌ Error testing ${endpoint.method} ${endpoint.path}: ${error.message}`);
  }
}

async function discoverAPIs() {
  console.log('🔍 GHL API Discovery Tool');
  console.log('🔑 Token: ' + TOKEN.substring(0, 20) + '...');
  console.log('');
  console.log('📡 Testing endpoints...\n');

  // Test each endpoint on each base URL
  for (const baseUrl of BASE_URLS) {
    console.log(`\n🌐 Testing ${baseUrl}...`);
    for (const endpoint of ENDPOINTS_TO_TEST) {
      await testEndpoint(baseUrl, endpoint);
      // Rate limiting
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log('\n✅ Discovery complete!\n');
  saveDocumentation();
}

function saveDocumentation() {
  // 1. All discovered endpoints
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '1-Discovered-Endpoints.json'),
    JSON.stringify({
      totalTested: ENDPOINTS_TO_TEST.length * BASE_URLS.length,
      successful: successfulEndpoints.length,
      failed: failedEndpoints.length,
      timestamp: new Date().toISOString(),
      endpoints: discoveredAPIs
    }, null, 2)
  );
  console.log('✅ 1-Discovered-Endpoints.json');

  // 2. Working endpoints
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '2-Working-Endpoints.json'),
    JSON.stringify({
      total: successfulEndpoints.length,
      endpoints: successfulEndpoints
    }, null, 2)
  );
  console.log('✅ 2-Working-Endpoints.json');

  // 3. Sample API Client
  const clientCode = generateSampleClient();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '3-Sample-API-Client.js'),
    clientCode
  );
  console.log('✅ 3-Sample-API-Client.js');

  // 4. cURL Examples
  const curlExamples = generateCurlExamples();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '4-cURL-Examples.md'),
    curlExamples
  );
  console.log('✅ 4-cURL-Examples.md');

  // 5. Documentation
  const docs = generateDocumentation();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'API-Documentation.md'),
    docs
  );
  console.log('✅ API-Documentation.md');

  console.log('\n📊 Summary:');
  console.log(`   Successful: ${successfulEndpoints.length}`);
  console.log(`   Failed: ${failedEndpoints.length}`);
  console.log(`   Total Tested: ${discoveredAPIs.length}`);
}

function generateSampleClient() {
  return `/**
 * GHL API Client - Auto-generated from API Discovery
 * Tested endpoints: ${successfulEndpoints.length}
 */

class GHLClient {
  constructor(tokenId, options = {}) {
    this.tokenId = tokenId;
    this.baseUrl = options.baseUrl || 'https://backend.leadconnectorhq.com';
    this.version = options.version || '1.0';
  }

  async request(method, path, data = null) {
    const url = new URL(path, this.baseUrl).href;
    const options = {
      method,
      headers: {
        'token-id': this.tokenId,
        'version': this.version,
        'Content-Type': 'application/json'
      }
    };

    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(\`GHL API Error: \${response.status} \${response.statusText}\`);
    }
    return response.json();
  }

  // Auto-generated methods from discovered endpoints
${successfulEndpoints.slice(0, 10).map((ep, i) => {
  const methodName = ep.endpoint
    .replace(/\//g, '_')
    .replace(/\{[^}]+\}/g, 'id')
    .replace(/^_/, '')
    .substring(0, 50);
  
  if (methodName && methodName.length > 2) {
    return `
  async ${methodName}(params = {}) {
    return this.request('${ep.method}', '${ep.endpoint}', params);
  }`;
  }
  return '';
}).join('')}
}

module.exports = GHLClient;
`;
}

function generateCurlExamples() {
  let examples = '# GHL API cURL Examples\n\n';
  examples += 'Generated: ' + new Date().toISOString() + '\n\n';
  examples += '## Authentication\n\n';
  examples += 'All requests require the \`token-id\` header:\n\n';
  examples += '\`\`\`bash\n';
  examples += 'TOKEN_ID="your-token-id"\n';
  examples += 'VERSION="1.0"\n';
  examples += '\`\`\`\n\n';

  examples += '## Examples\n\n';

  successfulEndpoints.slice(0, 10).forEach(ep => {
    examples += `### ${ep.method} ${ep.endpoint}\n\n`;
    examples += '\`\`\`bash\n';
    examples += `curl -X ${ep.method} \\\n`;
    examples += `  "${ep.baseUrl}${ep.endpoint}" \\\n`;
    examples += `  -H "token-id: $TOKEN_ID" \\\n`;
    examples += `  -H "version: $VERSION" \\\n`;
    examples += `  -H "Content-Type: application/json"\n`;
    examples += '\`\`\`\n\n';
  });

  return examples;
}

function generateDocumentation() {
  let doc = '# GHL API Discovery Report\n\n';
  doc += 'Generated: ' + new Date().toISOString() + '\n\n';

  doc += '## Summary\n\n';
  doc += `- **Total Endpoints Tested**: ${discoveredAPIs.length}\n`;
  doc += `- **Successful**: ${successfulEndpoints.length}\n`;
  doc += `- **Failed**: ${failedEndpoints.length}\n`;
  doc += `- **Success Rate**: ${((successfulEndpoints.length / discoveredAPIs.length) * 100).toFixed(2)}%\n\n`;

  doc += '## Authentication Pattern\n\n';
  doc += 'All endpoints use header-based authentication:\n\n';
  doc += '```\ntoken-id: [JWT Token]\nversion: 1.0\nContent-Type: application/json\n```\n\n';

  doc += '## Working Endpoints\n\n';
  successfulEndpoints.slice(0, 15).forEach(ep => {
    doc += `- **${ep.method}** \`${ep.endpoint}\` (${ep.name})\n`;
  });

  doc += '\n## Generated Files\n\n';
  doc += '1. **1-Discovered-Endpoints.json** - All tested endpoints and responses\n';
  doc += '2. **2-Working-Endpoints.json** - Only successful endpoints\n';
  doc += '3. **3-Sample-API-Client.js** - Ready-to-use JavaScript client\n';
  doc += '4. **4-cURL-Examples.md** - Example cURL commands\n';
  doc += '5. **API-Documentation.md** - This file\n';

  return doc;
}

discoverAPIs().catch(console.error);
