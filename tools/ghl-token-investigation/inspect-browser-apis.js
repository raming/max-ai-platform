#!/usr/bin/env node

/**
 * GHL Browser API Inspector
 * 
 * Comprehensive Puppeteer-based inspection tool for capturing:
 * - All XHR/fetch network calls to GHL APIs
 * - HTTP headers (Authorization, Content-Type, Accept, etc.)
 * - Request/response bodies and status codes
 * - DOM elements and JavaScript console APIs
 * - Authentication flows and token details
 * - Custom fields discovery and update mechanisms
 * - Workflow triggers and action definitions
 * 
 * This tool enables deep understanding of GHL browser client architecture
 * to inform architectural decisions on proxy encapsulation vs. direct browser access.
 * 
 * Usage:
 *   node inspect-browser-apis.js
 *   # Or with credentials:
 *   GHL_EMAIL=user@example.com GHL_PASSWORD=password node inspect-browser-apis.js
 * 
 * Output:
 *   - ghl-api-capture-{timestamp}.json (structured API findings)
 *   - ghl-headers-{timestamp}.json (headers mapping by endpoint)
 *   - ghl-console-logs-{timestamp}.json (browser console output)
 *   - ghl-dom-analysis-{timestamp}.json (DOM structure findings)
 */

const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { jwtDecode } = require('jwt-decode');

class GHLBrowserAPIInspector {
  constructor(options = {}) {
    this.options = {
      email: process.env.GHL_EMAIL || null,
      password: process.env.GHL_PASSWORD || null,
      headless: options.headless !== false,
      devtools: options.devtools !== false,
      ...options
    };

    this.browser = null;
    this.page = null;
    this.findings = {
      timestamp: new Date().toISOString(),
      apis: [],
      endpoints: {},
      headers: {},
      tokens: [],
      domElements: [],
      consoleLogs: [],
      workflows: [],
      customFields: [],
      webhooks: [],
      authentication: {},
      errors: [],
      notes: []
    };
  }

  async inspect() {
    console.log(chalk.blue('🔬 Starting GHL Browser API Inspection...'));

    try {
      await this.initializeBrowser();
      await this.navigateToGHL();

      if (this.options.email && this.options.password) {
        await this.login();
      } else {
        console.log(chalk.yellow('⚠️  No credentials provided. Opening browser for manual login.'));
        console.log(chalk.yellow('    Please log in manually, then the inspection will continue.'));
        await this.waitForManualLogin();
      }

      await this.captureAPIEndpoints();
      await this.captureHeaders();
      await this.captureDOMStructure();
      await this.captureConsoleAPIs();
      await this.navigateToWorkflows();
      await this.navigateToCustomFields();
      await this.captureAuthenticationDetails();

      await this.saveFindings();
      console.log(chalk.green('🎉 Inspection completed successfully!'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Inspection error:'), error.message);
      this.findings.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      await this.saveFindings();
      return false;
    } finally {
      await this.cleanup();
    }
  }

  async initializeBrowser() {
    console.log(chalk.blue('🌐 Launching browser with API inspection enabled...'));

    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      devtools: this.options.devtools,
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--disable-extensions',
        '--disable-sync'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    this.page = await this.browser.newPage();

    // Set up comprehensive network monitoring
    await this.setupNetworkCapture();

    // Monitor console for API calls and errors
    this.page.on('console', msg => this.captureConsoleMessage(msg));
    this.page.on('error', err => this.captureError('page', err));

    console.log(chalk.green('✅ Browser initialized with monitoring enabled'));
  }

  async setupNetworkCapture() {
    console.log(chalk.blue('🕵️ Setting up network capture...'));

    await this.page.setRequestInterception(true);

    this.page.on('request', (request) => {
      this.captureRequest(request);
      request.continue();
    });

    this.page.on('response', async (response) => {
      await this.captureResponse(response);
    });
  }

  captureRequest(request) {
    const url = request.url();
    const method = request.method();

    // Only capture GHL API calls
    if (!this.isGHLAPI(url)) return;

    const headers = request.headers();
    const postData = request.postData();

    const requestInfo = {
      timestamp: new Date().toISOString(),
      method,
      url,
      headers: {
        'authorization': headers['authorization'] || null,
        'content-type': headers['content-type'] || null,
        'accept': headers['accept'] || null,
        'user-agent': headers['user-agent'] || null,
        'x-requested-with': headers['x-requested-with'] || null,
        'x-api-key': headers['x-api-key'] || null,
        'referer': headers['referer'] || null
      },
      body: postData ? this.truncateBody(postData, 500) : null
    };

    // Store endpoint info
    const endpoint = this.extractEndpoint(url);
    if (!this.findings.endpoints[endpoint]) {
      this.findings.endpoints[endpoint] = {
        methods: new Set(),
        headers: {},
        requestSamples: [],
        responseSamples: []
      };
    }

    this.findings.endpoints[endpoint].methods.add(method);
    this.findings.endpoints[endpoint].requestSamples.push(requestInfo);

    // Store headers mapping
    this.storeHeadersMapping(url, headers);

    console.log(chalk.cyan(`📤 API Request: ${method} ${endpoint}`));
  }

  async captureResponse(response) {
    const url = response.url();
    if (!this.isGHLAPI(url)) return;

    const status = response.status();
    const headers = response.headers();

    try {
      const contentType = headers['content-type'] || '';
      let body = null;

      if (contentType.includes('application/json')) {
        body = await response.json();
      } else if (contentType.includes('text')) {
        body = await response.text();
      }

      const endpoint = this.extractEndpoint(url);

      if (!this.findings.endpoints[endpoint]) {
        this.findings.endpoints[endpoint] = {
          methods: new Set(),
          headers: {},
          requestSamples: [],
          responseSamples: []
        };
      }

      this.findings.endpoints[endpoint].responseSamples.push({
        timestamp: new Date().toISOString(),
        status,
        headers: {
          'content-type': headers['content-type'] || null,
          'cache-control': headers['cache-control'] || null,
          'x-ratelimit-limit': headers['x-ratelimit-limit'] || null,
          'x-ratelimit-remaining': headers['x-ratelimit-remaining'] || null,
          'x-ratelimit-reset': headers['x-ratelimit-reset'] || null
        },
        body: body ? this.truncateBody(JSON.stringify(body), 1000) : null
      });

      console.log(chalk.green(`📥 API Response: ${status} ${endpoint}`));

      // Extract tokens from response
      if (body && typeof body === 'object') {
        this.extractTokensFromObject(body, url);
      }
    } catch (e) {
      console.warn(chalk.yellow(`⚠️ Could not parse response from ${url}: ${e.message}`));
    }
  }

  storeHeadersMapping(url, headers) {
    const endpoint = this.extractEndpoint(url);

    if (!this.findings.headers[endpoint]) {
      this.findings.headers[endpoint] = {};
    }

    // Store non-sensitive headers
    const headerKeys = [
      'content-type', 'accept', 'x-requested-with', 'accept-language',
      'cache-control', 'x-ratelimit-limit', 'x-ratelimit-remaining',
      'x-ratelimit-reset', 'content-length'
    ];

    headerKeys.forEach(key => {
      if (headers[key]) {
        this.findings.headers[endpoint][key] = headers[key];
      }
    });
  }

  extractTokensFromObject(obj, source) {
    const tokenFields = ['token', 'access_token', 'id_token', 'jwt', 'authToken', 'sessionToken'];

    for (const field of tokenFields) {
      if (obj[field]) {
        const tokenInfo = this.analyzeToken(obj[field], source);
        if (tokenInfo) {
          this.findings.tokens.push(tokenInfo);
        }
      }
    }
  }

  analyzeToken(tokenString, source) {
    try {
      if (typeof tokenString !== 'string') return null;

      if (tokenString.includes('.')) {
        const decoded = jwtDecode(tokenString);
        return {
          source,
          type: 'JWT',
          length: tokenString.length,
          prefix: tokenString.substring(0, 20),
          decoded: {
            sub: decoded.sub || null,
            iss: decoded.iss || null,
            aud: decoded.aud || null,
            exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
            iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
            scope: decoded.scope || null,
            permissions: decoded.permissions || null
          }
        };
      } else {
        return {
          source,
          type: 'opaque',
          length: tokenString.length,
          prefix: tokenString.substring(0, 20)
        };
      }
    } catch (e) {
      return null;
    }
  }

  async navigateToGHL() {
    console.log(chalk.blue('🔗 Navigating to GHL...'));

    try {
      await this.page.goto('https://app.gohighlevel.com', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      console.log(chalk.green('✅ GHL page loaded'));
    } catch (e) {
      console.warn(chalk.yellow(`⚠️ Navigation warning: ${e.message}`));
    }
  }

  async login() {
    console.log(chalk.blue('🔐 Attempting automated login...'));

    try {
      // Wait for login form
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Fill email
      await this.page.type('input[type="email"]', this.options.email);
      console.log(chalk.cyan('📧 Email entered'));

      // Fill password
      await this.page.type('input[type="password"]', this.options.password);
      console.log(chalk.cyan('🔑 Password entered'));

      // Submit
      await this.page.click('button[type="submit"]');
      console.log(chalk.cyan('✅ Login form submitted'));

      // Wait for dashboard
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      console.log(chalk.green('✅ Login successful, dashboard loaded'));

    } catch (e) {
      console.error(chalk.red(`❌ Login failed: ${e.message}`));
      throw new Error('Automated login failed; please use manual login');
    }
  }

  async waitForManualLogin() {
    console.log(chalk.blue('⏳ Waiting for manual login (timeout: 5 minutes)...'));

    const startTime = Date.now();
    const maxWait = 5 * 60 * 1000;

    while (Date.now() - startTime < maxWait) {
      try {
        const url = this.page.url();

        // Check if we're on the dashboard (successful login)
        if (url.includes('app.gohighlevel.com') && !url.includes('/login') && !url.includes('/auth')) {
          console.log(chalk.green('✅ Login detected, proceeding with inspection'));
          await new Promise(r => setTimeout(r, 2000)); // Wait for page to settle
          return;
        }
      } catch (e) {
        // Ignore errors during checking
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    throw new Error('Manual login timeout exceeded');
  }

  async captureAPIEndpoints() {
    console.log(chalk.blue('📡 Capturing API endpoints from page interactions...'));

    // Scroll to trigger lazy loads
    await this.page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await new Promise(r => setTimeout(r, 2000));

    // Try to access different sections
    const sections = [
      { url: '/contacts', name: 'Contacts' },
      { url: '/workflows', name: 'Workflows' },
      { url: '/automations', name: 'Automations' },
      { url: '/settings', name: 'Settings' }
    ];

    for (const section of sections) {
      try {
        const fullUrl = `https://app.gohighlevel.com${section.url}`;
        console.log(chalk.cyan(`  🔄 Navigating to ${section.name}...`));

        await this.page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1500));

        console.log(chalk.green(`  ✅ ${section.name} section loaded`));
      } catch (e) {
        console.warn(chalk.yellow(`  ⚠️ Could not access ${section.name}: ${e.message}`));
      }
    }
  }

  async captureHeaders() {
    console.log(chalk.blue('📋 Analyzing headers by endpoint...'));

    // Convert endpoints object to include aggregated headers
    for (const [endpoint, data] of Object.entries(this.findings.endpoints)) {
      const requestSamples = data.requestSamples || [];
      const responseSamples = data.responseSamples || [];

      // Aggregate auth headers
      const authHeaders = new Set();
      requestSamples.forEach(sample => {
        if (sample.headers.authorization) {
          const [scheme, ...rest] = sample.headers.authorization.split(' ');
          authHeaders.add(scheme);
        }
      });

      this.findings.endpoints[endpoint].summary = {
        methods: Array.from(data.methods),
        authSchemes: Array.from(authHeaders),
        requestCount: requestSamples.length,
        responseCount: responseSamples.length,
        statusCodes: new Set(responseSamples.map(s => s.status))
      };
    }
  }

  async captureDOMStructure() {
    console.log(chalk.blue('🏗️ Analyzing DOM structure...'));

    const domInfo = await this.page.evaluate(() => {
      const elements = [];

      // Find API keys or tokens in window object
      const apiKeys = [];
      const checkObj = (obj, path = '', depth = 0) => {
        if (depth > 5) return; // Prevent infinite recursion
        if (obj === null || obj === undefined) return;

        const keys = Object.keys(obj).filter(k =>
          k.toLowerCase().includes('token') ||
          k.toLowerCase().includes('auth') ||
          k.toLowerCase().includes('api') ||
          k.toLowerCase().includes('key')
        );

        keys.forEach(key => {
          const val = obj[key];
          if (typeof val === 'string' && val.length > 20) {
            apiKeys.push({ path: `${path}.${key}`, valueType: typeof val });
          }
        });
      };

      if (window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth'))) {
            elements.push({ type: 'localStorage', key, valueType: 'string' });
          }
        }
      }

      if (window.sessionStorage) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth'))) {
            elements.push({ type: 'sessionStorage', key, valueType: 'string' });
          }
        }
      }

      // Check for API configuration objects
      if (window.__INITIAL_STATE__) {
        checkObj(window.__INITIAL_STATE__, '__INITIAL_STATE__');
      }

      if (window.__data__) {
        checkObj(window.__data__, '__data__');
      }

      return { elements, apiKeys };
    });

    this.findings.domElements = domInfo.elements || [];
    console.log(chalk.green(`✅ Found ${domInfo.elements.length} storage elements`));
  }

  async captureConsoleAPIs() {
    console.log(chalk.blue('💻 Capturing console messages...'));

    // Run some exploration commands in console
    try {
      const result = await this.page.evaluate(() => {
        const info = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          windowAPIs: [],
          globalObjects: []
        };

        // List some relevant window APIs
        const apis = ['fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage'];
        apis.forEach(api => {
          if (typeof window[api] !== 'undefined') {
            info.windowAPIs.push(api);
          }
        });

        // Look for GHL-specific globals
        const ghlObjects = ['ghl', 'GHL', '__ghl__', 'app', '__app__'];
        ghlObjects.forEach(obj => {
          if (typeof window[obj] !== 'undefined') {
            info.globalObjects.push(obj);
          }
        });

        return info;
      });

      this.findings.consoleLogs = result;
      console.log(chalk.green(`✅ Console analysis complete: ${result.windowAPIs.length} APIs found`));
    } catch (e) {
      console.warn(chalk.yellow(`⚠️ Console capture failed: ${e.message}`));
    }
  }

  async navigateToWorkflows() {
    console.log(chalk.blue('🔄 Navigating to Workflows section...'));

    try {
      await this.page.goto('https://app.gohighlevel.com/workflows', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(r => setTimeout(r, 3000));

      // Look for workflow triggers and actions
      const workflowInfo = await this.page.evaluate(() => {
        const workflows = [];
        const actions = [];
        const triggers = [];

        // Find elements that might contain workflow info
        document.querySelectorAll('[data-testid*="workflow"], .workflow-item').forEach(el => {
          workflows.push({
            text: el.textContent?.substring(0, 100),
            attributes: Array.from(el.attributes).map(a => `${a.name}=${a.value}`).slice(0, 5)
          });
        });

        // Look for action buttons/dropdowns
        document.querySelectorAll('[data-testid*="action"], .action-item, button[aria-label*="action" i]').forEach(el => {
          actions.push({
            text: el.textContent?.substring(0, 100),
            ariaLabel: el.getAttribute('aria-label')
          });
        });

        return { workflows: workflows.slice(0, 5), actions: actions.slice(0, 10), triggers };
      });

      this.findings.workflows = workflowInfo;
      console.log(chalk.green(`✅ Workflows section captured`));
    } catch (e) {
      console.warn(chalk.yellow(`⚠️ Could not capture workflows: ${e.message}`));
    }
  }

  async navigateToCustomFields() {
    console.log(chalk.blue('📋 Navigating to Custom Fields...'));

    try {
      await this.page.goto('https://app.gohighlevel.com/settings/custom-fields', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(r => setTimeout(r, 3000));

      // Look for custom fields
      const fieldsInfo = await this.page.evaluate(() => {
        const fields = [];

        document.querySelectorAll('[data-testid*="field"], .field-item, .custom-field').forEach(el => {
          const name = el.querySelector('[data-testid*="name"], .field-name, input[name*="name"]')?.textContent || el.getAttribute('data-field-name');
          const type = el.querySelector('[data-testid*="type"], .field-type, select')?.textContent || el.getAttribute('data-field-type');

          if (name) {
            fields.push({
              name: name.substring(0, 100),
              type: type?.substring(0, 50),
              element: el.className
            });
          }
        });

        return fields;
      });

      this.findings.customFields = fieldsInfo;
      console.log(chalk.green(`✅ Custom fields section captured: ${fieldsInfo.length} fields found`));
    } catch (e) {
      console.warn(chalk.yellow(`⚠️ Could not capture custom fields: ${e.message}`));
    }
  }

  async captureAuthenticationDetails() {
    console.log(chalk.blue('🔐 Capturing authentication details...'));

    const authInfo = await this.page.evaluate(() => {
      const info = {
        cookies: [],
        storageKeys: [],
        authPatterns: []
      };

      // Get cookies related to auth
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.split('=').map(s => s.trim());
        if (name && (name.toLowerCase().includes('auth') || name.toLowerCase().includes('session'))) {
          info.cookies.push({ name, valueLength: value?.length || 0 });
        }
      });

      // List storage keys
      if (window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          info.storageKeys.push({ storage: 'localStorage', key, valueLength: localStorage.getItem(key)?.length });
        }
      }

      return info;
    });

    this.findings.authentication = authInfo;
    console.log(chalk.green(`✅ Authentication details captured: ${authInfo.cookies.length} cookies, ${authInfo.storageKeys.length} storage keys`));
  }

  captureConsoleMessage(msg) {
    this.findings.consoleLogs.push({
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  }

  captureError(source, error) {
    this.findings.errors.push({
      timestamp: new Date().toISOString(),
      source,
      message: error.message || String(error),
      stack: error.stack
    });
  }

  isGHLAPI(url) {
    return url.includes('gohighlevel.com') ||
      url.includes('leadconnectorhq.com') ||
      url.includes('api.gohighlevel.com') ||
      url.includes('app.gohighlevel.com');
  }

  extractEndpoint(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search.split('&')[0]; // First param only for grouping
      return path;
    } catch {
      return url.substring(0, 100);
    }
  }

  truncateBody(body, maxLength = 500) {
    if (typeof body === 'string') {
      return body.length > maxLength ? body.substring(0, maxLength) + '...[truncated]' : body;
    }
    const str = JSON.stringify(body);
    return str.length > maxLength ? str.substring(0, maxLength) + '...[truncated]' : str;
  }

  storeHeadersMapping(url, headers) {
    const endpoint = this.extractEndpoint(url);

    if (!this.findings.headers[endpoint]) {
      this.findings.headers[endpoint] = {
        sampleHeaders: {},
        commonPatterns: {}
      };
    }

    // Store sample headers (non-sensitive)
    const safeHeaders = ['content-type', 'accept', 'accept-language', 'user-agent', 'referer'];
    safeHeaders.forEach(key => {
      if (headers[key]) {
        this.findings.headers[endpoint].sampleHeaders[key] = headers[key];
      }
    });
  }

  async saveFindings() {
    console.log(chalk.blue('💾 Saving findings...'));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = __dirname;

    // Convert Sets to Arrays for JSON serialization
    const sanitizedFindings = JSON.parse(JSON.stringify(this.findings, (key, value) => {
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    }));

    // Save comprehensive findings
    const findingsFile = path.join(outputDir, `ghl-api-capture-${timestamp}.json`);
    await fs.writeJson(findingsFile, sanitizedFindings, { spaces: 2 });
    console.log(chalk.green(`✅ Findings saved to: ${findingsFile}`));

    // Save headers mapping separately
    const headersFile = path.join(outputDir, `ghl-headers-${timestamp}.json`);
    await fs.writeJson(headersFile, this.findings.headers, { spaces: 2 });
    console.log(chalk.green(`✅ Headers saved to: ${headersFile}`));

    // Save console logs
    const consoleFile = path.join(outputDir, `ghl-console-${timestamp}.json`);
    await fs.writeJson(consoleFile, this.findings.consoleLogs, { spaces: 2 });
    console.log(chalk.green(`✅ Console logs saved to: ${consoleFile}`));

    // Save DOM analysis
    const domFile = path.join(outputDir, `ghl-dom-${timestamp}.json`);
    await fs.writeJson(domFile, this.findings.domElements, { spaces: 2 });
    console.log(chalk.green(`✅ DOM analysis saved to: ${domFile}`));

    // Create summary report
    const summary = {
      timestamp: sanitizedFindings.timestamp,
      totalEndpointsCaptured: Object.keys(this.findings.endpoints).length,
      totalAPICallsCaptured: Object.values(this.findings.endpoints).reduce((sum, ep) => sum + (ep.requestSamples?.length || 0), 0),
      tokensFound: this.findings.tokens.length,
      storageElementsFound: this.findings.domElements.length,
      endpointSummary: Object.entries(this.findings.endpoints).map(([endpoint, data]) => ({
        endpoint,
        methods: data.summary?.methods || [],
        requestCount: data.requestSamples?.length || 0,
        responseCount: data.responseSamples?.length || 0
      }))
    };

    const summaryFile = path.join(outputDir, `ghl-inspection-summary-${timestamp}.json`);
    await fs.writeJson(summaryFile, summary, { spaces: 2 });
    console.log(chalk.green(`✅ Summary saved to: ${summaryFile}`));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI execution
if (require.main === module) {
  const inspector = new GHLBrowserAPIInspector({
    headless: process.env.HEADLESS !== 'false',
    devtools: process.env.DEVTOOLS !== 'false'
  });

  inspector.inspect().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = GHLBrowserAPIInspector;
