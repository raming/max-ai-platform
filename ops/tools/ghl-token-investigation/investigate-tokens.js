#!/usr/bin/env node

/**
 * GHL Token Investigation Tool
 * 
 * This script uses Puppeteer to monitor network traffic during GHL login
 * and token refresh operations to understand their authentication flow.
 * 
 * Usage:
 *   npm run investigate
 * 
 * What it captures:
 * - All network requests/responses during login
 * - Cookie changes and storage updates
 * - JWT token structures and expiry times
 * - Refresh token endpoints and flows
 */

const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { jwtDecode } = require('jwt-decode');

class GHLTokenInvestigator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.networkLog = [];
    this.tokenLog = [];
    this.cookieLog = [];
    this.storageLog = [];
    this.outputDir = './investigation-results';
  }

  async initialize() {
    console.log(chalk.blue('🚀 Initializing GHL Token Investigation...'));
    
    // Ensure output directory exists
    await fs.ensureDir(this.outputDir);
    
    // Launch browser with debugging enabled
    this.browser = await puppeteer.launch({
      headless: false, // Set to false so you can interact with login
      devtools: true,  // Open DevTools automatically
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled'
      ],
      defaultViewport: null
    });
    
    this.page = await this.browser.newPage();
    
    // Set up network monitoring
    await this.setupNetworkMonitoring();
    
    // Set up storage monitoring
    await this.setupStorageMonitoring();
    
    console.log(chalk.green('✅ Browser initialized with monitoring enabled'));
  }

  async setupNetworkMonitoring() {
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      // Log all requests, especially auth-related ones
      const url = request.url();
      const method = request.method();
      const headers = request.headers();
      
      if (this.isAuthRelated(url) || this.hasAuthHeaders(headers)) {
        const logEntry = {
          timestamp: new Date().toISOString(),
          type: 'request',
          method,
          url,
          headers: this.sanitizeHeaders(headers),
          postData: request.postData()
        };
        
        this.networkLog.push(logEntry);
        console.log(chalk.yellow(`🌐 Request: ${method} ${url}`));
        
        if (headers.authorization) {
          console.log(chalk.cyan(`🔑 Auth Header: ${headers.authorization.substring(0, 20)}...`));
        }
      }
      
      request.continue();
    });
    
    this.page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      
      if (this.isAuthRelated(url)) {
        let body = null;
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            body = await response.json();
          } else {
            body = await response.text();
          }
        } catch (e) {
          body = 'Could not parse response body';
        }
        
        const logEntry = {
          timestamp: new Date().toISOString(),
          type: 'response',
          url,
          status,
          headers: this.sanitizeHeaders(response.headers()),
          body: this.sanitizeBody(body)
        };
        
        this.networkLog.push(logEntry);
        console.log(chalk.green(`📡 Response: ${status} ${url}`));
        
        // Check for tokens in response
        await this.extractTokensFromResponse(body, url);
      }
    });
  }

  async setupStorageMonitoring() {
    // Monitor localStorage and sessionStorage changes
    await this.page.evaluateOnNewDocument(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
          window.tokenChanges = window.tokenChanges || [];
          window.tokenChanges.push({
            timestamp: new Date().toISOString(),
            storage: this === localStorage ? 'localStorage' : 'sessionStorage',
            action: 'setItem',
            key,
            value: value.substring(0, 100) + (value.length > 100 ? '...' : '')
          });
        }
        return originalSetItem.call(this, key, value);
      };
    });
  }

  async navigateToGHL() {
    console.log(chalk.blue('🌐 Navigating to GHL...'));
    await this.page.goto('https://app.gohighlevel.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log(chalk.yellow('⏰ Please complete the login process manually...'));
    console.log(chalk.yellow('   The script will monitor all network traffic during login.'));
    console.log(chalk.yellow('   Press ENTER when you have successfully logged in and want to continue.'));
  }

  async waitForUserInput() {
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  async monitorTokenRefresh() {
    console.log(chalk.blue('🔄 Starting token refresh monitoring...'));
    console.log(chalk.yellow('   Now navigate around GHL, especially to areas that might trigger token refresh.'));
    console.log(chalk.yellow('   Try accessing different sections, wait for timeouts, etc.'));
    console.log(chalk.yellow('   Press ENTER when you want to stop monitoring.'));
    
    // Monitor for a period while user navigates
    const monitoringInterval = setInterval(async () => {
      // Check for token changes in storage
      const tokenChanges = await this.page.evaluate(() => {
        const changes = window.tokenChanges || [];
        window.tokenChanges = []; // Clear after reading
        return changes;
      });
      
      if (tokenChanges.length > 0) {
        this.storageLog.push(...tokenChanges);
        tokenChanges.forEach(change => {
          console.log(chalk.magenta(`💾 Storage: ${change.action} ${change.key} in ${change.storage}`));
        });
      }
    }, 1000);
    
    await this.waitForUserInput();
    clearInterval(monitoringInterval);
  }

  isAuthRelated(url) {
    const authPatterns = [
      '/auth',
      '/login',
      '/token',
      '/refresh',
      '/oauth',
      '/api/v1/oauth',
      '/api/oauth',
      'auth.gohighlevel.com',
      'login.gohighlevel.com'
    ];
    
    return authPatterns.some(pattern => url.includes(pattern));
  }

  hasAuthHeaders(headers) {
    return headers.authorization || headers.cookie?.includes('token') || headers.cookie?.includes('auth');
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    
    // Partially redact sensitive headers
    if (sanitized.authorization) {
      sanitized.authorization = sanitized.authorization.substring(0, 20) + '...';
    }
    
    if (sanitized.cookie) {
      sanitized.cookie = sanitized.cookie.substring(0, 100) + '...';
    }
    
    return sanitized;
  }

  sanitizeBody(body) {
    if (typeof body === 'string') {
      if (body.length > 1000) {
        return body.substring(0, 1000) + '...';
      }
      return body;
    }
    
    if (typeof body === 'object' && body !== null) {
      const sanitized = { ...body };
      
      // Redact sensitive fields but keep structure
      const sensitiveFields = ['password', 'token', 'access_token', 'refresh_token', 'secret'];
      
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = sanitized[field].toString().substring(0, 20) + '...';
        }
      }
      
      return sanitized;
    }
    
    return body;
  }

  async extractTokensFromResponse(body, url) {
    if (typeof body === 'object' && body !== null) {
      const tokenFields = ['token', 'access_token', 'refresh_token', 'id_token', 'jwt'];
      
      for (const field of tokenFields) {
        if (body[field]) {
          try {
            const tokenInfo = {
              timestamp: new Date().toISOString(),
              url,
              field,
              token: body[field].substring(0, 50) + '...',
              decoded: null
            };
            
            // Try to decode JWT
            if (body[field].includes('.')) {
              try {
                tokenInfo.decoded = jwtDecode(body[field]);
                console.log(chalk.cyan(`🔓 JWT decoded: exp=${tokenInfo.decoded.exp}, iat=${tokenInfo.decoded.iat}`));
              } catch (e) {
                tokenInfo.decoded = 'Failed to decode';
              }
            }
            
            this.tokenLog.push(tokenInfo);
          } catch (e) {
            console.log(chalk.red(`❌ Error processing token: ${e.message}`));
          }
        }
      }
    }
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    const results = {
      timestamp,
      summary: {
        networkRequests: this.networkLog.length,
        tokensFound: this.tokenLog.length,
        storageChanges: this.storageLog.length
      },
      networkLog: this.networkLog,
      tokenLog: this.tokenLog,
      storageLog: this.storageLog
    };
    
    const filename = path.join(this.outputDir, `ghl-investigation-${timestamp}.json`);
    await fs.writeJson(filename, results, { spaces: 2 });
    
    console.log(chalk.green(`💾 Results saved to: ${filename}`));
    
    // Create summary report
    await this.createSummaryReport(results, timestamp);
  }

  async createSummaryReport(results, timestamp) {
    const reportPath = path.join(this.outputDir, `summary-${timestamp}.md`);
    
    let report = `# GHL Token Investigation Summary\n\n`;
    report += `**Timestamp**: ${timestamp}\n\n`;
    report += `## Overview\n\n`;
    report += `- Network Requests Captured: ${results.networkLog.length}\n`;
    report += `- Tokens Found: ${results.tokenLog.length}\n`;
    report += `- Storage Changes: ${results.storageLog.length}\n\n`;
    
    report += `## Key Findings\n\n`;
    
    // Auth endpoints found
    const authEndpoints = [...new Set(results.networkLog.map(log => log.url).filter(url => this.isAuthRelated(url)))];
    if (authEndpoints.length > 0) {
      report += `### Authentication Endpoints\n\n`;
      authEndpoints.forEach(endpoint => {
        report += `- ${endpoint}\n`;
      });
      report += `\n`;
    }
    
    // Token types found
    if (results.tokenLog.length > 0) {
      report += `### Tokens Discovered\n\n`;
      results.tokenLog.forEach(token => {
        report += `- **${token.field}** from ${token.url}\n`;
        if (token.decoded && typeof token.decoded === 'object') {
          report += `  - Expires: ${new Date(token.decoded.exp * 1000).toISOString()}\n`;
          report += `  - Issued: ${new Date(token.decoded.iat * 1000).toISOString()}\n`;
        }
      });
      report += `\n`;
    }
    
    report += `## Next Steps\n\n`;
    report += `1. Review detailed logs in the JSON file\n`;
    report += `2. Identify refresh token endpoints\n`;
    report += `3. Analyze token expiry patterns\n`;
    report += `4. Design automated refresh strategy\n`;
    
    await fs.writeFile(reportPath, report);
    console.log(chalk.green(`📋 Summary report saved to: ${reportPath}`));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.navigateToGHL();
      await this.waitForUserInput();
      await this.monitorTokenRefresh();
      await this.saveResults();
      
      console.log(chalk.green('🎉 Investigation completed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Investigation failed:'), error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the investigation
if (require.main === module) {
  const investigator = new GHLTokenInvestigator();
  investigator.run();
}

module.exports = GHLTokenInvestigator;