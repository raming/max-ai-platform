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

// Initialize output
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function normalizeHeaders(headers) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    const lowerKey = key.toLowerCase();
    if (value && typeof value === 'string' && value.length > 100) {
      normalized[lowerKey] = value.substring(0, 50) + '...[' + value.length + ' chars]';
    } else {
      normalized[lowerKey] = value;
    }
  }
  return normalized;
}

function identifyAuthMethod(headers) {
  const normalized = normalizeHeaders(headers);
  const methods = {
    'token-id': !!normalized['token-id'],
    'authorization': !!normalized['authorization'],
    'bearer-token': normalized['authorization'] && normalized['authorization'].startsWith('Bearer'),
    'custom-auth': false
  };

  for (const key in normalized) {
    if ((key.includes('auth') || key.includes('token') || key.includes('api-key')) &&
        !['token-id', 'authorization'].includes(key)) {
      methods['custom-auth'] = true;
      methods[key] = normalized[key];
    }
  }

  return methods;
}

function recordApiCall(request, response = null, timing = {}) {
  const url = request.url();
  const method = request.method();
  const headers = normalizeHeaders(request.headers());
  const authMethods = identifyAuthMethod(headers);

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
  const endpoint = new URL(url).pathname;
  if (!endpointRegistry.has(endpoint)) {
    endpointRegistry.set(endpoint, {
      endpoint,
      method,
      callCount: 0,
      authMethods: new Set(),
      headers: new Set()
    });
  }

  const registry = endpointRegistry.get(endpoint);
  registry.callCount++;
  Object.keys(authMethods).forEach(m => registry.authMethods.add(m));
  Object.keys(headers).forEach(h => registry.headers.add(h));

  // Track auth patterns
  for (const [method, value] of Object.entries(authMethods)) {
    if (value) {
      if (!authenticationPatterns.has(method)) {
        authenticationPatterns.set(method, { method, count: 0, headers: new Set() });
      }
      const pattern = authenticationPatterns.get(method);
      pattern.count++;
      Object.keys(headers).forEach(h => pattern.headers.add(h));
    }
  }

  // Track headers
  for (const [key, value] of Object.entries(headers)) {
    if (!headerPatterns.has(key)) {
      headerPatterns.set(key, { header: key, values: new Set(), count: 0 });
    }
    const pattern = headerPatterns.get(key);
    pattern.count++;
    if (value && typeof value === 'string' && value.length < 100) {
      pattern.values.add(value);
    }
  }
}

function detectTokenRefresh(request) {
  const url = request.url();
  const method = request.method();

  const refreshIndicators = [
    '/token/update',
    '/signin/refresh',
    '/oauth',
    'refresh'
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
  }

  return isRefresh;
}

function saveDocumentation() {
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

  // 2. Authentication patterns
  const authPatterns = {
    patterns: Array.from(authenticationPatterns.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      associatedHeaders: Array.from(data.headers)
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

  // 3. Header patterns
  const headerData = {
    headers: Array.from(headerPatterns.entries()).map(([header, data]) => ({
      header,
      count: data.count,
      values: Array.from(data.values).slice(0, 10),
      totalUniqueValues: data.values.size
    })),
    summary: {
      totalHeaders: headerPatterns.size,
      headersUsed: Array.from(headerPatterns.keys()).sort()
    }
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '3-Header-Patterns.json'),
    JSON.stringify(headerData, null, 2)
  );

  // 4. Endpoint registry
  const endpointData = {
    totalEndpoints: endpointRegistry.size,
    endpoints: Array.from(endpointRegistry.entries()).map(([endpoint, data]) => ({
      endpoint,
      method: data.method,
      callCount: data.callCount,
      authMethods: Array.from(data.authMethods),
      headers: Array.from(data.headers)
    })).sort((a, b) => b.callCount - a.callCount)
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '4-Endpoint-Registry.json'),
    JSON.stringify(endpointData, null, 2)
  );

  // 5. Token refresh events
  const refreshData = {
    totalRefreshEvents: tokenRefreshEvents.length,
    events: tokenRefreshEvents
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '5-Token-Refresh-Events.json'),
    JSON.stringify(refreshData, null, 2)
  );

  // 6. Create comprehensive guide
  const guidePath = path.join(OUTPUT_DIR, 'README.md');
  const guide = createGuide(authPatterns, headerData, endpointData, tokenRefreshEvents);
  fs.writeFileSync(guidePath, guide);

  console.log('📊 Documentation saved to:', OUTPUT_DIR);
  console.log('Files created:');
  console.log('  - 1-API-Calls-Complete-Log.json');
  console.log('  - 2-Authentication-Patterns.json');
  console.log('  - 3-Header-Patterns.json');
  console.log('  - 4-Endpoint-Registry.json');
  console.log('  - 5-Token-Refresh-Events.json');
  console.log('  - README.md (comprehensive guide)');
}

function createGuide(authPatterns, headerData, endpointData, tokenRefreshEvents) {
  let guide = '# GHL API Integration Documentation\n\n';
  guide += 'Generated: ' + new Date().toISOString() + '\n\n';
  
  guide += '## Summary\n\n';
  guide += '- **Total API Calls**: ' + apiCalls.length + '\n';
  guide += '- **Unique Endpoints**: ' + endpointData.totalEndpoints + '\n';
  guide += '- **Authentication Methods**: ' + authPatterns.summary.totalMethods + '\n';
  guide += '- **Header Types**: ' + headerData.summary.totalHeaders + '\n';
  guide += '- **Token Refresh Events**: ' + tokenRefreshEvents.length + '\n\n';

  guide += '## Authentication Methods Detected\n\n';
  authPatterns.patterns.forEach(p => {
    guide += '### ' + p.method + '\n';
    guide += '- **Count**: ' + p.count + ' requests\n';
    guide += '- **Associated Headers**: ' + p.associatedHeaders.join(', ') + '\n\n';
  });

  guide += '## Critical Headers\n\n';
  const criticalHeaders = ['token-id', 'authorization', 'version', 'content-type'];
  headerData.headers.forEach(h => {
    if (criticalHeaders.includes(h.header)) {
      guide += '### ' + h.header + '\n';
      guide += '- **Count**: ' + h.count + ' requests\n';
      guide += '- **Unique Values**: ' + h.totalUniqueValues + '\n';
      if (h.values.length > 0) {
        guide += '- **Sample Values**: ' + h.values.slice(0, 3).join(', ') + '\n';
      }
      guide += '\n';
    }
  });

  guide += '## Top Endpoints\n\n';
  endpointData.endpoints.slice(0, 15).forEach(e => {
    guide += '### ' + e.method + ' ' + e.endpoint + '\n';
    guide += '- **Calls**: ' + e.callCount + '\n';
    guide += '- **Auth Methods**: ' + e.authMethods.join(', ') + '\n';
    guide += '- **Headers Used**: ' + e.headers.length + '\n\n';
  });

  guide += '## Implementation Notes\n\n';
  guide += '1. **Primary Authentication**: Use token-id header with JWT token\n';
  guide += '2. **Fallback Methods**: Authorization Bearer header for some endpoints\n';
  guide += '3. **Version Header**: Required for all API calls\n';
  guide += '4. **Token Refresh**: Automatic refresh on 401 responses\n\n';

  return guide;
}

async function main() {
  console.log('🚀 Launching Puppeteer for GHL API monitoring...');
  console.log('📝 Email: ' + CREDENTIALS.email);
  console.log('💾 Output: ' + OUTPUT_DIR);
  console.log('');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 120000
  });

  try {
    const page = await browser.newPage();
    let requestStartTime = {};

    page.on('request', (request) => {
      requestStartTime[request.url()] = Date.now();
      detectTokenRefresh(request);
    });

    page.on('response', (response) => {
      const request = response.request();
      const url = request.url();
      
      if (url.includes('backend.leadconnectorhq.com') || 
          url.includes('1prompt.com') ||
          url.includes('locationapi')) {
        
        const timing = {
          startTime: requestStartTime[url] || Date.now(),
          duration: Date.now() - (requestStartTime[url] || Date.now())
        };

        recordApiCall(request, response, timing);

        const shortUrl = url.substring(url.lastIndexOf('/'));
        console.log('📡 ' + response.status() + ' ' + request.method() + ' ' + shortUrl);
      }
    });

    console.log('🌐 Navigating to login...');
    await page.goto('https://app.1prompt.com/login', { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', CREDENTIALS.email);
    await page.type('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

    console.log('⏳ Ready for API monitoring...');
    console.log('📋 Interact with the admin portal to record API calls');
    console.log('Press Ctrl+C to stop and save documentation\n');

    await new Promise(resolve => setTimeout(resolve, 300000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n💾 Saving documentation...');
    saveDocumentation();
    await browser.close();
    console.log('✅ Complete! Check ' + OUTPUT_DIR);
  }
}

process.on('SIGINT', async () => {
  console.log('\n⏹️  Stopping...');
  saveDocumentation();
  process.exit(0);
});

main().catch(console.error);
