#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Data structures
const apiCalls = [];
const authenticationPatterns = new Map();
const headerPatterns = new Map();
const tokenRefreshEvents = [];
const endpointRegistry = new Map();

const OUTPUT_DIR = path.join(__dirname, 'api-documentation');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function normalizeHeaders(headers) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    const lowerKey = key.toLowerCase();
    if (value && typeof value === 'string') {
      if (value.length > 100) {
        normalized[lowerKey] = {
          value: value.substring(0, 50) + '...',
          length: value.length,
          full: value
        };
      } else {
        normalized[lowerKey] = value;
      }
    } else {
      normalized[lowerKey] = value;
    }
  }
  return normalized;
}

function identifyAuthMethod(headers) {
  const normalized = normalizeHeaders(headers);
  const methods = [];
  
  if (normalized['token-id']) {
    methods.push({
      type: 'token-id',
      value: typeof normalized['token-id'] === 'string' ? normalized['token-id'].substring(0, 50) : normalized['token-id']
    });
  }
  
  if (normalized['authorization']) {
    const authValue = normalized['authorization'];
    if (typeof authValue === 'string') {
      if (authValue.startsWith('Bearer')) {
        methods.push({
          type: 'bearer-token',
          value: authValue.substring(0, 50)
        });
      } else {
        methods.push({
          type: 'authorization',
          value: authValue.substring(0, 50)
        });
      }
    }
  }

  // Check for custom auth headers
  for (const key in normalized) {
    if ((key.includes('x-auth') || key.includes('api-key') || key.includes('token')) &&
        !['token-id', 'authorization', 'content-type', 'content-length'].includes(key)) {
      methods.push({
        type: `custom-${key}`,
        value: String(normalized[key]).substring(0, 50)
      });
    }
  }

  return methods;
}

function recordApiCall(request, response = null, timing = {}) {
  const url = request.url();
  const method = request.method();
  const headers = normalizeHeaders(request.headers());
  const authMethods = identifyAuthMethod(headers);
  
  // Only record API calls, not page resources
  const isApiCall = url.includes('leadconnectorhq.com') || 
                    url.includes('1prompt.com') || 
                    url.includes('apisystem.tech');
  
  if (!isApiCall) return;

  const callRecord = {
    timestamp: new Date().toISOString(),
    url,
    method,
    headers,
    authMethods,
    postData: request.postDataBuffer() ? request.postDataBuffer().toString() : null,
    response: {
      status: response ? response.status() : null,
      statusText: response ? response.statusText() : null,
      headers: response ? normalizeHeaders(response.headers()) : null
    },
    timing
  };

  apiCalls.push(callRecord);

  // Track endpoint
  try {
    const urlObj = new URL(url);
    const endpoint = urlObj.pathname;
    
    if (!endpointRegistry.has(endpoint)) {
      endpointRegistry.set(endpoint, {
        endpoint,
        method,
        baseUrl: urlObj.origin,
        callCount: 0,
        authMethods: new Set(),
        headers: new Set(),
        statusCodes: new Set()
      });
    }

    const registry = endpointRegistry.get(endpoint);
    registry.callCount++;
    if (response) registry.statusCodes.add(response.status());
    authMethods.forEach(am => registry.authMethods.add(JSON.stringify(am)));
    Object.keys(headers).forEach(h => registry.headers.add(h));
  } catch (e) {
    // Ignore URL parse errors
  }

  // Track auth patterns
  authMethods.forEach(authMethod => {
    const methodKey = authMethod.type;
    if (!authenticationPatterns.has(methodKey)) {
      authenticationPatterns.set(methodKey, { 
        type: methodKey, 
        count: 0, 
        endpoints: new Set(),
        samples: [] 
      });
    }
    const pattern = authenticationPatterns.get(methodKey);
    pattern.count++;
    pattern.endpoints.add(request.url().split('?')[0]);
    if (pattern.samples.length < 3) {
      pattern.samples.push({
        endpoint: request.url().split('?')[0],
        timestamp: new Date().toISOString()
      });
    }
  });

  // Track headers
  for (const [key, value] of Object.entries(headers)) {
    if (!headerPatterns.has(key)) {
      headerPatterns.set(key, { 
        header: key, 
        values: new Set(), 
        count: 0,
        endpoints: new Set() 
      });
    }
    const pattern = headerPatterns.get(key);
    pattern.count++;
    
    if (value && typeof value === 'string' && value.length < 100) {
      pattern.values.add(value);
    } else if (value && typeof value === 'object') {
      pattern.values.add(JSON.stringify(value).substring(0, 100));
    }
    
    pattern.endpoints.add(request.url().split('?')[0]);
  }
}

function detectTokenRefresh(request) {
  const url = request.url();
  const method = request.method();

  const refreshIndicators = [
    '/token/update',
    '/signin/refresh',
    '/oauth',
    '/refresh',
    '/authenticate'
  ];

  const isRefresh = refreshIndicators.some(indicator => 
    url.toLowerCase().includes(indicator.toLowerCase())
  );

  if (isRefresh) {
    tokenRefreshEvents.push({
      timestamp: new Date().toISOString(),
      url,
      method,
      headers: normalizeHeaders(request.headers())
    });
    console.log('🔄 Token refresh detected:', url);
  }

  return isRefresh;
}

function createSampleCode() {
  const sampleCode = [];
  
  // Get top 5 endpoints by call count
  const topEndpoints = Array.from(endpointRegistry.entries())
    .sort((a, b) => b[1].callCount - a[1].callCount)
    .slice(0, 5);

  sampleCode.push('// Generated API Sample Code');
  sampleCode.push('// Created: ' + new Date().toISOString());
  sampleCode.push('');
  sampleCode.push('class GHLAPIClient {');
  sampleCode.push('  constructor(tokenId, options = {}) {');
  sampleCode.push('    this.tokenId = tokenId;');
  sampleCode.push('    this.baseUrl = options.baseUrl || "https://backend.leadconnectorhq.com";');
  sampleCode.push('    this.defaultHeaders = {');
  
  // Add common headers
  const criticalHeaders = new Map();
  apiCalls.slice(0, 100).forEach(call => {
    Object.keys(call.headers).forEach(h => {
      if (!criticalHeaders.has(h)) {
        criticalHeaders.set(h, call.headers[h]);
      }
    });
  });

  criticalHeaders.forEach((value, key) => {
    if (key !== 'authorization' && key !== 'token-id' && key !== 'cookie') {
      sampleCode.push(`      '${key}': '${typeof value === 'string' ? value.substring(0, 50) : value}',`);
    }
  });

  sampleCode.push('      "Content-Type": "application/json"');
  sampleCode.push('    };');
  sampleCode.push('  }');
  sampleCode.push('');
  sampleCode.push('  async request(method, endpoint, data = null) {');
  sampleCode.push('    const url = `${this.baseUrl}${endpoint}`;');
  sampleCode.push('    const headers = {');
  sampleCode.push('      ...this.defaultHeaders,');
  sampleCode.push('      "token-id": this.tokenId');
  sampleCode.push('    };');
  sampleCode.push('');
  sampleCode.push('    const config = { method, headers };');
  sampleCode.push('    if (data) config.body = JSON.stringify(data);');
  sampleCode.push('');
  sampleCode.push('    const response = await fetch(url, config);');
  sampleCode.push('    if (!response.ok) throw new Error(`API Error: ${response.status}`);');
  sampleCode.push('    return response.json();');
  sampleCode.push('  }');
  sampleCode.push('');

  // Add methods for top endpoints
  topEndpoints.forEach(([endpoint, data], i) => {
    const methodName = endpoint
      .replace(/\//g, '_')
      .replace(/\{[^}]+\}/g, 'id')
      .replace(/^_/, '')
      .substring(0, 50);
    
    if (methodName && methodName.length > 2) {
      sampleCode.push(`  async ${methodName}(params = {}) {`);
      sampleCode.push(`    return this.request('${data.method}', '${endpoint}', params);`);
      sampleCode.push('  }');
      sampleCode.push('');
    }
  });

  sampleCode.push('}');
  sampleCode.push('');
  sampleCode.push('// Usage:');
  sampleCode.push('// const client = new GHLAPIClient("your-token-id");');
  sampleCode.push('// const result = await client.get_users_id();');
  sampleCode.push('');
  sampleCode.push('module.exports = GHLAPIClient;');

  return sampleCode.join('\n');
}

function saveDocumentation() {
  console.log('\n💾 Saving documentation...');

  // 1. Complete API calls log
  const apiCallsLog = {
    totalCalls: apiCalls.length,
    timeRange: {
      start: apiCalls.length > 0 ? apiCalls[0].timestamp : null,
      end: apiCalls.length > 0 ? apiCalls[apiCalls.length - 1].timestamp : null
    },
    calls: apiCalls
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '1-API-Calls-Complete-Log.json'),
    JSON.stringify(apiCallsLog, null, 2)
  );
  console.log('✅ 1-API-Calls-Complete-Log.json');

  // 2. Authentication patterns
  const authPatterns = {
    patterns: Array.from(authenticationPatterns.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      endpoints: Array.from(data.endpoints).slice(0, 10),
      samples: data.samples
    })),
    summary: {
      totalMethods: authenticationPatterns.size,
      methodsUsed: Array.from(authenticationPatterns.keys())
    }
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '2-Authentication-Patterns.json'),
    JSON.stringify(authPatterns, null, 2)
  );
  console.log('✅ 2-Authentication-Patterns.json');

  // 3. Header patterns
  const headerData = {
    headers: Array.from(headerPatterns.entries()).map(([header, data]) => ({
      header,
      count: data.count,
      values: Array.from(data.values).slice(0, 10),
      totalUniqueValues: data.values.size,
      endpointsUsed: Array.from(data.endpoints).slice(0, 5)
    })),
    summary: {
      totalHeaders: headerPatterns.size,
      criticalHeaders: ['token-id', 'authorization', 'version', 'content-type'],
      headersUsed: Array.from(headerPatterns.keys()).sort()
    }
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '3-Header-Patterns.json'),
    JSON.stringify(headerData, null, 2)
  );
  console.log('✅ 3-Header-Patterns.json');

  // 4. Endpoint registry
  const endpointData = {
    totalEndpoints: endpointRegistry.size,
    endpoints: Array.from(endpointRegistry.entries()).map(([endpoint, data]) => ({
      endpoint,
      method: data.method,
      baseUrl: data.baseUrl,
      callCount: data.callCount,
      authMethods: Array.from(data.authMethods),
      headers: Array.from(data.headers),
      statusCodes: Array.from(data.statusCodes)
    })).sort((a, b) => b.callCount - a.callCount)
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '4-Endpoint-Registry.json'),
    JSON.stringify(endpointData, null, 2)
  );
  console.log('✅ 4-Endpoint-Registry.json');

  // 5. Token refresh events
  const refreshData = {
    totalRefreshEvents: tokenRefreshEvents.length,
    events: tokenRefreshEvents
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '5-Token-Refresh-Events.json'),
    JSON.stringify(refreshData, null, 2)
  );
  console.log('✅ 5-Token-Refresh-Events.json');

  // 6. Sample code
  const sampleCode = createSampleCode();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '6-Sample-API-Client.js'),
    sampleCode
  );
  console.log('✅ 6-Sample-API-Client.js');

  // 7. Create comprehensive guide
  createGuide(authPatterns, headerData, endpointData, tokenRefreshEvents);
  console.log('✅ README.md');

  console.log('\n📊 Complete! All files saved to:', OUTPUT_DIR);
}

function createGuide(authPatterns, headerData, endpointData, tokenRefreshEvents) {
  let guide = '# GHL API Integration - Complete Documentation\n\n';
  guide += 'Generated: ' + new Date().toISOString() + '\n\n';
  
  guide += '## 📊 Executive Summary\n\n';
  guide += `- **Total API Calls Captured**: ${apiCalls.length}\n`;
  guide += `- **Unique Endpoints**: ${endpointData.totalEndpoints}\n`;
  guide += `- **Authentication Methods**: ${authPatterns.summary.totalMethods}\n`;
  guide += `- **Unique Headers**: ${headerData.summary.totalHeaders}\n`;
  guide += `- **Token Refresh Events**: ${tokenRefreshEvents.length}\n\n`;

  guide += '## 🔐 Authentication Methods\n\n';
  authPatterns.patterns.forEach(p => {
    guide += `### ${p.type}\n`;
    guide += `- **Usage Count**: ${p.count} requests\n`;
    guide += `- **Endpoints**: ${Math.min(5, p.endpoints.length)} unique endpoints\n`;
    if (p.samples.length > 0) {
      guide += `- **First Seen**: ${p.samples[0].timestamp}\n`;
    }
    guide += '\n';
  });

  guide += '## 📋 Critical Headers\n\n';
  const criticalHeaders = ['token-id', 'authorization', 'version', 'content-type', 'channel', 'source'];
  headerData.headers.forEach(h => {
    if (criticalHeaders.includes(h.header)) {
      guide += `### ${h.header}\n`;
      guide += `- **Usage**: ${h.count} requests\n`;
      guide += `- **Unique Values**: ${h.totalUniqueValues}\n`;
      if (h.values.length > 0) {
        guide += `- **Sample Values**: ${Array.from(h.values).slice(0, 3).join(', ')}\n`;
      }
      guide += '\n';
    }
  });

  guide += '## 🔌 Top Endpoints\n\n';
  endpointData.endpoints.slice(0, 20).forEach(e => {
    guide += `### ${e.method} ${e.endpoint}\n`;
    guide += `- **Base URL**: ${e.baseUrl}\n`;
    guide += `- **Call Count**: ${e.callCount}\n`;
    guide += `- **Auth Methods**: ${Array.from(JSON.parse(e.authMethods[0] || '{}')).map(a => a.type || a).join(', ')}\n`;
    guide += `- **Status Codes**: ${Array.from(e.statusCodes).join(', ')}\n\n`;
  });

  guide += '## 💡 Implementation Guide\n\n';
  guide += '### Basic Authentication Flow\n\n';
  guide += '```javascript\n';
  guide += '// 1. Login and get token-id\n';
  guide += 'const loginResponse = await fetch("https://app.1prompt.com/login", {\n';
  guide += '  method: "POST",\n';
  guide += '  body: JSON.stringify(credentials)\n';
  guide += '});\n';
  guide += '\n';
  guide += '// 2. Use token-id in subsequent requests\n';
  guide += 'const headers = {\n';
  guide += '  "token-id": tokenId,\n';
  guide += '  "version": "1.0",\n';
  guide += '  "Content-Type": "application/json"\n';
  guide += '};\n';
  guide += '```\n\n';

  guide += '### Testing Endpoints\n\n';
  guide += 'Use the generated `6-Sample-API-Client.js` to test endpoints:\n\n';
  guide += '```javascript\n';
  guide += 'const GHLAPIClient = require("./6-Sample-API-Client.js");\n';
  guide += 'const client = new GHLAPIClient(tokenId);\n';
  guide += '// Call endpoints based on captured patterns\n';
  guide += '```\n\n';

  guide += '## 📁 Files Generated\n\n';
  guide += '- `1-API-Calls-Complete-Log.json` - All captured API calls with headers\n';
  guide += '- `2-Authentication-Patterns.json` - Auth method analysis\n';
  guide += '- `3-Header-Patterns.json` - Header usage patterns\n';
  guide += '- `4-Endpoint-Registry.json` - Complete endpoint catalog\n';
  guide += '- `5-Token-Refresh-Events.json` - Token refresh tracking\n';
  guide += '- `6-Sample-API-Client.js` - Ready-to-use API client code\n';
  guide += '- `README.md` - This file\n\n';

  guide += '## 🧪 Next Steps\n\n';
  guide += '1. Review `4-Endpoint-Registry.json` to understand all available endpoints\n';
  guide += '2. Check `2-Authentication-Patterns.json` for auth requirements\n';
  guide += '3. Use `6-Sample-API-Client.js` to test API calls\n';
  guide += '4. Update your implementation with discovered patterns\n';

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'README.md'),
    guide
  );
}

async function main() {
  console.log('🚀 GHL API Monitor v2');
  console.log('📧 User: ' + CREDENTIALS.email);
  console.log('💾 Output: ' + OUTPUT_DIR);
  console.log('');

  let browser;
  try {
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    
    // Set up request/response listeners
    let requestStartTime = {};

    page.on('request', (request) => {
      requestStartTime[request.url()] = Date.now();
      detectTokenRefresh(request);
    });

    page.on('response', (response) => {
      const request = response.request();
      const url = request.url();
      
      const timing = {
        startTime: requestStartTime[url] || Date.now(),
        duration: Date.now() - (requestStartTime[url] || Date.now())
      };

      recordApiCall(request, response, timing);

      const shortUrl = url.substring(url.lastIndexOf('/'));
      console.log(`📡 [${response.status()}] ${request.method()} ${shortUrl}`);
    });

    console.log('🔐 Navigating to login...');
    await page.goto('https://app.1prompt.com/login', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    }).catch(e => console.log('Navigation warning:', e.message));

    // Wait for login form
    console.log('⏳ Waiting for login form...');
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    } catch (e) {
      console.log('⚠️  Login form not found, retrying...');
    }

    console.log('🔑 Entering credentials...');
    await page.type('input[type="email"]', CREDENTIALS.email, { delay: 50 });
    await page.type('input[type="password"]', CREDENTIALS.password, { delay: 50 });
    
    console.log('🚀 Submitting login...');
    await page.click('button[type="submit"]').catch(() => {
      console.log('⚠️  Could not click submit');
    });

    // Wait for navigation
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    }).catch(e => {
      console.log('Navigation timeout (this is ok):', e.message);
    });

    console.log('\n✅ Browser ready for monitoring!');
    console.log('📋 Interact with the admin console to record API calls');
    console.log('Press Ctrl+C to stop and save documentation\n');

    // Keep page open for 5 minutes
    await new Promise(resolve => setTimeout(resolve, 300000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    saveDocumentation();
    console.log('\n✅ Monitoring complete!');
  }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n⏹️  Stopping monitor...');
  saveDocumentation();
  process.exit(0);
});

main().catch(console.error);
