#!/usr/bin/env node

/**
 * GHL Browser API Inspector - Puppeteer Automation Script
 * 
 * Purpose: Automate GoHighLevel browser login and capture all API calls,
 *          HTTP headers, authentication tokens, and network patterns.
 * 
 * Usage:
 *   node puppeteer-capture.js --email <email> --password <password> [--output <file>] [--headless true|false]
 * 
 * Environment Variables (alternative to CLI args):
 *   GHL_EMAIL - GoHighLevel login email
 *   GHL_PASSWORD - GoHighLevel login password
 *   GHL_OUTPUT_FILE - Output file for captured data (default: ghl-capture.json)
 *   GHL_HEADLESS - Run browser headless (default: true)
 * 
 * Output:
 *   - ghl-capture.json: Captured API calls, headers, request/response patterns
 *   - ghl-capture.log: Detailed execution log
 * 
 * Requirements:
 *   npm install puppeteer dotenv
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { parse: parseUrl } = require('url');

// Configuration
const CONFIG = {
  email: process.env.GHL_EMAIL || process.argv[process.argv.indexOf('--email') + 1],
  password: process.env.GHL_PASSWORD || process.argv[process.argv.indexOf('--password') + 1],
  outputFile: process.env.GHL_OUTPUT_FILE || process.argv[process.argv.indexOf('--output') + 1] || 'ghl-capture.json',
  headless: process.env.GHL_HEADLESS !== 'false',
  logFile: 'ghl-capture.log',
  timeout: 30000,
  navigationTimeout: 20000,
};

// Captured data structure
const captured = {
  metadata: {
    captureDate: new Date().toISOString(),
    platform: 'GoHighLevel',
    baseUrl: 'https://app.gohighlevel.com',
  },
  authentication: {
    oauth_endpoints: [],
    token_patterns: [],
    session_headers: [],
    auth_flow: [],
  },
  api_calls: [],
  websocket_connections: [],
  rate_limit_headers: [],
  errors: [],
  navigation_log: [],
};

// Logger
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.stream = fs.createWriteStream(logFile, { flags: 'a' });
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logMessage.trim());
    this.stream.write(logMessage);
  }

  error(message) { this.log(message, 'ERROR'); }
  debug(message) { this.log(message, 'DEBUG'); }
  info(message) { this.log(message, 'INFO'); }

  close() {
    this.stream.end();
  }
}

const logger = new Logger(CONFIG.logFile);

// Helper: Sanitize sensitive data
function sanitizeData(data) {
  const sensitive = [
    'authorization', 'x-api-key', 'cookie', 'x-ghl-token',
    'password', 'token', 'refresh_token', 'access_token',
  ];

  const sanitized = JSON.parse(JSON.stringify(data));

  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (let key in obj) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitizeObj(obj[key]);
      }
    }
    return obj;
  };

  return sanitizeObj(sanitized);
}

// Helper: Extract headers from CDP network events
function captureNetworkEvent(requestWillBeSent, responseReceived) {
  const request = requestWillBeSent.request;
  const response = responseReceived?.response;

  const url = request.url;
  const method = request.method;
  const headers = request.headers;
  const postData = request.postData;

  // Only capture GHL API calls
  if (!url.includes('gohighlevel.com') && !url.includes('localhost')) {
    return null;
  }

  const capture = {
    timestamp: new Date().toISOString(),
    url: url,
    method: method,
    path: parseUrl(url).pathname,
    domain: parseUrl(url).hostname,
    headers: sanitizeData(headers),
    postData: postData ? sanitizeData({ body: postData }) : null,
    response: null,
  };

  if (response) {
    capture.response = {
      status: response.status,
      statusText: response.statusText,
      headers: sanitizeData(response.headers),
      mimeType: response.mimeType,
    };

    // Capture rate limit headers
    const rateLimitHeaders = Object.entries(response.headers).filter(([key]) =>
      key.toLowerCase().includes('rate-limit') || key.toLowerCase().includes('x-ratelimit')
    );
    if (rateLimitHeaders.length > 0) {
      captured.rate_limit_headers.push({
        url: url,
        headers: Object.fromEntries(rateLimitHeaders),
      });
    }

    // Identify OAuth endpoints
    if (url.includes('oauth') || url.includes('auth')) {
      captured.authentication.oauth_endpoints.push(url);
    }
  }

  return capture;
}

// Main automation
async function runInspection() {
  logger.info('Starting GHL API Inspector...');
  logger.info(`Configuration: headless=${CONFIG.headless}, timeout=${CONFIG.timeout}ms`);

  if (!CONFIG.email || !CONFIG.password) {
    logger.error('Email and password required. Use --email <email> --password <password> or set GHL_EMAIL/GHL_PASSWORD');
    process.exit(1);
  }

  let browser;

  try {
    // Launch browser
    logger.info('Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    // Set extended timeout
    page.setDefaultTimeout(CONFIG.timeout);
    page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

    // Enable request interception for detailed capture
    await page.on('requestfinished', async (request) => {
      try {
        const response = request.response();
        if (response && response.ok()) {
          const url = request.url();
          if (url.includes('gohighlevel.com')) {
            captured.api_calls.push({
              timestamp: new Date().toISOString(),
              url: url,
              method: request.method(),
              status: response.status(),
              headers: sanitizeData(response.headers()),
            });
            logger.debug(`Captured: ${request.method()} ${url} [${response.status()}]`);
          }
        }
      } catch (e) {
        logger.debug(`Error capturing request: ${e.message}`);
      }
    });

    // Capture failed requests
    await page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.includes('gohighlevel.com')) {
        captured.errors.push({
          timestamp: new Date().toISOString(),
          url: url,
          method: request.method(),
          error: request.failure().errorText,
        });
        logger.error(`Request failed: ${request.method()} ${url} - ${request.failure().errorText}`);
      }
    });

    // Capture WebSocket connections
    const originalWsConstructor = page.evaluateOnNewDocument(() => {
      const originalWS = window.WebSocket;
      window.WebSocket = class ExtendedWebSocket extends originalWS {
        constructor(url, protocols) {
          super(url, protocols);
          console.log(`[WS_CONNECT] ${url}`);
          this.addEventListener('message', (event) => {
            console.log(`[WS_MESSAGE] ${event.data.substring(0, 100)}...`);
          });
          this.addEventListener('error', (event) => {
            console.log(`[WS_ERROR] ${event.message}`);
          });
        }
      };
    });

    // Navigate to GHL login
    logger.info('Navigating to GHL login page...');
    captured.navigation_log.push({
      timestamp: new Date().toISOString(),
      action: 'navigate',
      url: 'https://app.gohighlevel.com/login',
    });

    await page.goto('https://app.gohighlevel.com/login', {
      waitUntil: 'networkidle2',
    });

    // Extract all page console logs for WebSocket info
    page.on('console', (msg) => {
      if (msg.text().includes('[WS_')) {
        captured.websocket_connections.push({
          timestamp: new Date().toISOString(),
          log: msg.text(),
        });
        logger.info(`WebSocket event: ${msg.text()}`);
      }
    });

    // Wait for email input and enter credentials
    logger.info('Waiting for email input field...');
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', {
      timeout: CONFIG.timeout,
    });

    logger.info(`Entering credentials...`);
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    if (emailInput) {
      await emailInput.type(CONFIG.email, { delay: 50 });
      captured.authentication.auth_flow.push('Entered email');
    }

    // Find and fill password
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type(CONFIG.password, { delay: 50 });
      captured.authentication.auth_flow.push('Entered password');
    }

    // Click login button
    const loginButton = await page.$('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    if (loginButton) {
      logger.info('Clicking login button...');
      await loginButton.click();
      captured.authentication.auth_flow.push('Clicked login');
    }

    // Wait for navigation
    logger.info('Waiting for dashboard load...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {
      logger.info('Navigation timeout (expected for some AJAX-heavy pages)');
    });

    captured.navigation_log.push({
      timestamp: new Date().toISOString(),
      action: 'login_complete',
      url: page.url(),
    });

    // Navigate through key UI sections to trigger API calls
    const navigationPaths = [
      { path: '/contacts', label: 'Contacts' },
      { path: '/pipelines', label: 'Opportunities/Pipelines' },
      { path: '/calendar', label: 'Calendar' },
      { path: '/settings', label: 'Settings' },
    ];

    for (const nav of navigationPaths) {
      try {
        const targetUrl = `https://app.gohighlevel.com${nav.path}`;
        logger.info(`Navigating to ${nav.label}: ${nav.path}`);
        captured.navigation_log.push({
          timestamp: new Date().toISOString(),
          action: 'navigate',
          label: nav.label,
          url: nav.path,
        });

        await page.goto(targetUrl, { waitUntil: 'networkidle2' }).catch(() => {
          logger.debug(`Navigation to ${nav.path} failed (expected for some pages)`);
        });

        // Wait for page to settle
        await page.waitForTimeout(2000);
      } catch (e) {
        logger.error(`Error navigating to ${nav.label}: ${e.message}`);
      }
    }

    // Interact with common elements to trigger API calls
    logger.info('Triggering API interactions...');

    // Try to interact with search/filter elements
    const searchInputs = await page.$$('input[placeholder*="search" i], input[placeholder*="filter" i]');
    if (searchInputs.length > 0) {
      logger.info(`Found ${searchInputs.length} search inputs, interacting...`);
      await searchInputs[0].type('test', { delay: 100 });
      await page.waitForTimeout(1000);
    }

    // Try to expand dropdowns/modals
    const buttons = await page.$$('button[aria-label*="filter" i], button[aria-label*="sort" i]');
    for (let i = 0; i < Math.min(3, buttons.length); i++) {
      try {
        await buttons[i].click();
        await page.waitForTimeout(500);
      } catch (e) {
        logger.debug(`Error clicking button ${i}: ${e.message}`);
      }
    }

    // Extract authentication tokens from localStorage
    logger.info('Extracting authentication information...');
    const authData = await page.evaluate(() => {
      return {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
      };
    });

    // Look for common token patterns
    const tokenPatterns = [
      'token', 'access_token', 'refresh_token', 'auth', 'authorization',
      'user_token', 'api_key', 'x_api_key', 'jwt',
    ];

    for (const [key, value] of Object.entries(authData.localStorage)) {
      if (tokenPatterns.some(p => key.toLowerCase().includes(p))) {
        captured.authentication.token_patterns.push({
          key: key,
          type: 'localStorage',
          length: String(value).length,
          format: String(value).substring(0, 50),
        });
        logger.info(`Found token pattern in localStorage: ${key}`);
      }
    }

    // Extract request/response headers from network
    logger.info('Analyzing captured headers...');
    const uniqueHeaders = new Set();
    captured.api_calls.forEach(call => {
      if (call.headers) {
        Object.keys(call.headers).forEach(header => {
          if (!header.toLowerCase().startsWith('content-') &&
            !header.toLowerCase().startsWith('accept-') &&
            header.toLowerCase() !== 'user-agent') {
            uniqueHeaders.add(header);
          }
        });
      }
    });

    captured.authentication.session_headers = Array.from(uniqueHeaders)
      .map(h => ({ header: h, sampleValue: captured.api_calls.find(c => c.headers?.[h])?.headers?.[h] }));

    // Generate summary
    logger.info('Generating capture summary...');
    captured.summary = {
      total_api_calls: captured.api_calls.length,
      unique_endpoints: [...new Set(captured.api_calls.map(c => c.url))].length,
      unique_domains: [...new Set(captured.api_calls.map(c => parseUrl(c.url).hostname))],
      rate_limit_headers_found: captured.rate_limit_headers.length,
      websocket_connections: captured.websocket_connections.length,
      errors: captured.errors.length,
      oauth_endpoints_found: captured.authentication.oauth_endpoints.length,
      token_patterns_found: captured.authentication.token_patterns.length,
    };

    // Save capture to file
    const outputPath = path.join(process.cwd(), CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(captured, null, 2));
    logger.info(`Capture saved to: ${outputPath}`);

    // Print summary
    logger.info(`\n=== CAPTURE SUMMARY ===`);
    logger.info(`Total API calls captured: ${captured.summary.total_api_calls}`);
    logger.info(`Unique endpoints: ${captured.summary.unique_endpoints}`);
    logger.info(`Rate limit headers found: ${captured.summary.rate_limit_headers_found}`);
    logger.info(`WebSocket connections: ${captured.summary.websocket_connections}`);
    logger.info(`Auth token patterns: ${captured.summary.token_patterns_found}`);
    logger.info(`Errors: ${captured.summary.errors}`);
    logger.info(`\nDetailed output saved to: ${outputPath}`);
    logger.info(`Log saved to: ${CONFIG.logFile}`);

  } catch (error) {
    logger.error(`Inspection failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    if (browser) {
      logger.info('Closing browser...');
      await browser.close();
    }
    logger.close();
  }
}

// Run inspection
runInspection().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
