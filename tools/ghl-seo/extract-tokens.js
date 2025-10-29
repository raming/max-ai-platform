#!/usr/bin/env node

/**
 * GHL Token Extractor & Analyzer
 *
 * Analyzes browser storage and network requests to identify
 * authentication tokens and refresh mechanisms
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class TokenExtractor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.tokens = {
      localStorage: {},
      sessionStorage: {},
      cookies: [],
      networkTokens: []
    };
  }

  async launchBrowser() {
    console.log(chalk.blue('🔍 Launching browser for token analysis...'));

    try {
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();

      // Monitor network requests for tokens
      this.page.on('request', (request) => {
        const headers = request.headers();
        const url = request.url();
        const method = request.method();

        // Capture ALL headers that might contain tokens
        const authHeaders = {};
        Object.keys(headers).forEach(headerName => {
          const lowerName = headerName.toLowerCase();
          if (lowerName.includes('token') ||
              lowerName.includes('auth') ||
              lowerName.includes('authorization') ||
              lowerName === 'x-api-key' ||
              lowerName === 'x-auth-token' ||
              lowerName === 'token-id' ||
              headers[headerName].length > 50) { // Long values are likely tokens
            authHeaders[headerName] = headers[headerName];
          }
        });

        // If we found auth headers, capture this request
        if (Object.keys(authHeaders).length > 0) {
          this.tokens.networkTokens.push({
            method,
            url,
            headers: authHeaders,
            timestamp: new Date().toISOString()
          });

          // Log immediately for real-time feedback
          const authHeader = authHeaders['Authorization'] || authHeaders['authorization'] ||
                           Object.entries(authHeaders).find(([k,v]) => k.toLowerCase().includes('token'))?.[1] ||
                           Object.values(authHeaders)[0];

          if (authHeader) {
            console.log(chalk.magenta(`🔑 Network Token: ${method} ${url.split('?')[0].split('/').slice(-2).join('/')}`));
            console.log(chalk.gray(`   Auth: ${authHeader.substring(0, 50)}${authHeader.length > 50 ? '...' : ''}`));
          }
        }

        // Also check for token refresh patterns
        if (url.includes('token') && (url.includes('refresh') || url.includes('update'))) {
          console.log(chalk.yellow(`🔄 Token Refresh: ${method} ${url}`));
        }
      });

      console.log(chalk.green('✅ Browser launched successfully!'));
      console.log(chalk.yellow('🌐 Navigating to GoHighLevel admin...'));

      await this.page.goto('https://app.1prompt.com', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      console.log(chalk.green('✅ Page loaded!'));

      // Wait a bit for any initial tokens to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log(chalk.blue('\n📋 Instructions:'));
      console.log('1. Login manually using your GHL credentials');
      console.log('2. Just wait for login to complete (no need to navigate)');
      console.log('3. Press Ctrl+C when login is done to capture tokens');
      console.log('');

      // Keep browser open for manual interaction
      await this.keepAlive();

    } catch (error) {
      console.error(chalk.red('❌ Failed to launch browser:'), error.message);
      process.exit(1);
    }
  }

  async keepAlive() {
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Analyzing browser storage...'));
      await this.analyzeStorage();
      await this.browser.close();
      console.log(chalk.green('✅ Analysis complete! Check token-analysis.json'));
      process.exit(0);
    });

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async analyzeStorage() {
    try {
      // Get localStorage
      this.tokens.localStorage = await this.page.evaluate(() => {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);

          // Look for token-like keys and values
          if (key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('auth') ||
              key.toLowerCase().includes('session') ||
              value.length > 50) { // Long values are likely tokens
            storage[key] = value;
          }
        }
        return storage;
      });

      // Get sessionStorage
      this.tokens.sessionStorage = await this.page.evaluate(() => {
        const storage = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          const value = sessionStorage.getItem(key);

          if (key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('auth') ||
              key.toLowerCase().includes('session') ||
              value.length > 50) {
            storage[key] = value;
          }
        }
        return storage;
      });

      // Get cookies
      this.tokens.cookies = await this.page.cookies();

      // Analyze tokens
      await this.analyzeTokens();

    } catch (error) {
      console.error(chalk.red('Failed to analyze storage:'), error.message);
    }
  }

  async analyzeTokens() {
    console.log(chalk.green('\n🔍 TOKEN ANALYSIS RESULTS\n'));

    // Analyze localStorage
    console.log(chalk.blue('📦 LocalStorage Tokens:'));
    const localTokens = Object.entries(this.tokens.localStorage);
    if (localTokens.length === 0) {
      console.log(chalk.gray('   No tokens found'));
    } else {
      localTokens.forEach(([key, value]) => {
        console.log(chalk.cyan(`   ${key}:`));
        console.log(chalk.gray(`     ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`));

        // Try to identify token type
        if (value.includes('.')) {
          console.log(chalk.green('     → Likely JWT token'));
        } else if (value.length > 200) {
          console.log(chalk.green('     → Likely session token'));
        }
      });
    }

    // Analyze sessionStorage
    console.log(chalk.blue('\n💾 SessionStorage Tokens:'));
    const sessionTokens = Object.entries(this.tokens.sessionStorage);
    if (sessionTokens.length === 0) {
      console.log(chalk.gray('   No tokens found'));
    } else {
      sessionTokens.forEach(([key, value]) => {
        console.log(chalk.cyan(`   ${key}:`));
        console.log(chalk.gray(`     ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`));
      });
    }

    // Analyze cookies
    console.log(chalk.blue('\n🍪 Auth Cookies:'));
    const authCookies = this.tokens.cookies.filter(cookie =>
      cookie.name.toLowerCase().includes('token') ||
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('session')
    );

    if (authCookies.length === 0) {
      console.log(chalk.gray('   No auth cookies found'));
    } else {
      authCookies.forEach(cookie => {
        console.log(chalk.cyan(`   ${cookie.name}:`));
        console.log(chalk.gray(`     ${cookie.value.substring(0, 100)}${cookie.value.length > 100 ? '...' : ''}`));
      });
    }

    // Analyze network tokens
    console.log(chalk.blue('\n🌐 Network Tokens:'));
    if (this.tokens.networkTokens.length === 0) {
      console.log(chalk.gray('   No network tokens captured'));
    } else {
      // Group by auth method for better analysis
      const authMethods = {};
      
      this.tokens.networkTokens.forEach(token => {
        const headerNames = Object.keys(token.headers);
        const primaryHeader = headerNames.find(h => h.toLowerCase().includes('authorization')) || 
                            headerNames.find(h => h.toLowerCase().includes('token')) || 
                            headerNames[0];
        
        if (!authMethods[primaryHeader]) {
          authMethods[primaryHeader] = [];
        }
        authMethods[primaryHeader].push(token);
      });

      Object.entries(authMethods).forEach(([headerName, tokens]) => {
        console.log(chalk.cyan(`   ${headerName} (${tokens.length} calls):`));
        const sampleToken = tokens[0];
        const authValue = sampleToken.headers[headerName];
        console.log(chalk.gray(`     ${authValue.substring(0, 80)}${authValue.length > 80 ? '...' : ''}`));
        
        // Show sample endpoints
        const endpoints = tokens.slice(0, 3).map(t => 
          `${t.method} ${t.url.split('?')[0].split('/').slice(-2).join('/')}`
        );
        console.log(chalk.gray(`     Endpoints: ${endpoints.join(', ')}`));
      });
    }

    // Provide recommendations
    await this.provideRecommendations();

    // Save results
    await this.saveResults();
  }

  async provideRecommendations() {
    console.log(chalk.green('\n💡 RECOMMENDATIONS\n'));

    const hasLocalTokens = Object.keys(this.tokens.localStorage).length > 0;
    const hasSessionTokens = Object.keys(this.tokens.sessionStorage).length > 0;
    const hasNetworkTokens = this.tokens.networkTokens.length > 0;

    if (hasLocalTokens) {
      console.log(chalk.yellow('✅ Found localStorage tokens - these are likely your session tokens!'));
      console.log(chalk.gray('   Try these keys in localStorage after login.'));
    }

    if (hasSessionTokens) {
      console.log(chalk.yellow('✅ Found sessionStorage tokens - check these as well.'));
    }

    if (hasNetworkTokens) {
      console.log(chalk.yellow('✅ Captured network tokens - these show the exact format needed.'));
    }

    if (!hasLocalTokens && !hasSessionTokens && !hasNetworkTokens) {
      console.log(chalk.red('❌ No tokens found - make sure you logged in successfully.'));
      console.log(chalk.gray('   Try again and wait a moment after login completes.'));
    }

    console.log(chalk.blue('\n🔄 Token Refresh Mechanism:'));
    console.log(chalk.gray('   Look for endpoints containing "token" and "refresh" or "update"'));
    console.log(chalk.gray('   These maintain session validity automatically.'));
  }

  async saveResults() {
    try {
      const outputDir = path.join('./scraped-data');
      await fs.mkdir(outputDir, { recursive: true });

      const filePath = path.join(outputDir, 'token-analysis.json');

      const results = {
        timestamp: new Date().toISOString(),
        analysis: this.tokens,
        summary: {
          localStorageTokens: Object.keys(this.tokens.localStorage).length,
          sessionStorageTokens: Object.keys(this.tokens.sessionStorage).length,
          authCookies: this.tokens.cookies.filter(c =>
            c.name.toLowerCase().includes('token') ||
            c.name.toLowerCase().includes('auth')
          ).length,
          networkTokens: this.tokens.networkTokens.length
        },
        recommendations: [
          'Check localStorage keys containing "token", "auth", or "session"',
          'Look for long string values (>50 characters) - these are likely tokens',
          'Try tokens with "Bearer " prefix for API authentication',
          'Monitor Network tab for token refresh endpoints'
        ]
      };

      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      console.log(chalk.green(`💾 Analysis saved to ${filePath}`));

    } catch (error) {
      console.error(chalk.red('Failed to save results:'), error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const extractor = new TokenExtractor();
  extractor.launchBrowser().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = TokenExtractor;