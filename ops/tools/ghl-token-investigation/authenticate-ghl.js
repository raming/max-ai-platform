#!/usr/bin/env node

/**
 * GHL Authentication Helper
 * 
 * Handles initial human authentication to acquire tokens for automated refresh.
 * This script needs to be run whenever:
 * 1. Setting up GHL integration for first time
 * 2. After extended token refresh failures
 * 3. When manual re-authentication is required
 * 
 * Usage:
 *   npm run auth-ghl
 *   # OR
 *   node authenticate-ghl.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { jwtDecode } = require('jwt-decode');

class GHLAuthenticator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.capturedTokens = {
      sessionToken: null,
      apiTokens: [],
      workflowToken: null,
      locationIds: [],
      expiresAt: null
    };
    this.authCompleted = false;
  }

  async authenticate() {
    console.log(chalk.blue('🔐 Starting GHL Authentication...'));
    console.log(chalk.yellow('   This will open a browser window for you to log in manually.'));
    console.log(chalk.yellow('   Complete the full login process including 2FA if required.'));
    
    try {
      await this.initializeBrowser();
      await this.navigateToLogin();
      await this.captureAuthenticationFlow();
      await this.waitForAuthenticationCompletion();
      
      if (this.authCompleted && this.hasValidTokens()) {
        await this.saveTokens();
        console.log(chalk.green('🎉 Authentication completed successfully!'));
        return true;
      } else {
        console.log(chalk.red('❌ Authentication failed - no valid tokens captured'));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('❌ Authentication error:'), error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }

  async initializeBrowser() {
    console.log(chalk.blue('🌐 Launching browser...'));
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run'
      ],
      defaultViewport: null
    });

    this.page = await this.browser.newPage();
    await this.setupTokenCapture();
  }

  async setupTokenCapture() {
    console.log(chalk.blue('🕵️ Setting up token capture...'));
    
    // Intercept network traffic to capture tokens
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      const url = request.url();
      const headers = request.headers();
      
      // Log auth-related requests
      if (this.isAuthRelated(url)) {
        console.log(chalk.cyan(`📤 Auth Request: ${request.method()} ${url}`));
        
        if (headers.authorization) {
          this.extractTokenFromHeader(headers.authorization, url);
        }
      }
      
      request.continue();
    });
    
    this.page.on('response', async (response) => {
      const url = response.url();
      
      if (this.isAuthRelated(url)) {
        console.log(chalk.green(`📥 Auth Response: ${response.status()} ${url}`));
        
        if (response.status() === 200 || response.status() === 201) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              const responseData = await response.json();
              await this.extractTokensFromResponse(responseData, url);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    });
  }

  async navigateToLogin() {
    console.log(chalk.blue('🔗 Navigating to GHL login page...'));
    
    await this.page.goto('https://app.gohighlevel.com/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log(chalk.yellow('👤 Please complete the login process:'));
    console.log(chalk.yellow('   1. Enter your email and password'));
    console.log(chalk.yellow('   2. Complete 2FA verification if prompted'));  
    console.log(chalk.yellow('   3. Wait for the main dashboard to load'));
    console.log(chalk.yellow('   4. The script will automatically detect successful login'));
  }

  async captureAuthenticationFlow() {
    // Monitor for successful authentication indicators
    const authCheckInterval = setInterval(async () => {
      try {
        // Check if we're on the main dashboard (successful login)
        const currentUrl = this.page.url();
        
        if (currentUrl.includes('app.gohighlevel.com') && 
            !currentUrl.includes('/login') && 
            !currentUrl.includes('/auth') &&
            this.hasValidTokens()) {
          
          console.log(chalk.green('✅ Successful login detected!'));
          this.authCompleted = true;
          clearInterval(authCheckInterval);
        }
      } catch (error) {
        // Ignore errors during checking
      }
    }, 2000); // Check every 2 seconds
    
    // Store interval reference for cleanup
    this.authCheckInterval = authCheckInterval;
  }

  async waitForAuthenticationCompletion() {
    console.log(chalk.blue('⏳ Waiting for authentication completion...'));
    
    // Wait up to 10 minutes for manual authentication
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes
    const startTime = Date.now();
    
    while (!this.authCompleted && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Give user progress indication
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed % 30 === 0) { // Every 30 seconds
        console.log(chalk.gray(`   Still waiting... (${elapsed}s elapsed)`));
      }
    }
    
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
    
    if (!this.authCompleted) {
      throw new Error('Authentication timed out after 10 minutes');
    }
  }

  isAuthRelated(url) {
    const authPatterns = [
      '/auth', '/login', '/oauth', '/token', '/refresh',
      'leadconnectorhq.com/oauth',
      'leadconnectorhq.com/appengine/api/token'
    ];
    
    return authPatterns.some(pattern => url.includes(pattern));
  }

  extractTokenFromHeader(authHeader, url) {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Try to decode if it's a JWT
        if (token.includes('.')) {
          const decoded = jwtDecode(token);
          const expiresAt = new Date(decoded.exp * 1000);
          
          console.log(chalk.cyan(`🔓 JWT Token found: expires at ${expiresAt.toISOString()}`));
          
          // Store the main session token (longest one is usually the main token)
          if (!this.capturedTokens.sessionToken || token.length > this.capturedTokens.sessionToken.length) {
            this.capturedTokens.sessionToken = token;
            this.capturedTokens.expiresAt = expiresAt;
          }
          
          // Store API tokens
          if (!this.capturedTokens.apiTokens.includes(token)) {
            this.capturedTokens.apiTokens.push(token);
          }
        } else {
          // Non-JWT token (workflow token)
          console.log(chalk.cyan(`🔑 Non-JWT Token found: ${token.substring(0, 20)}...`));
          if (!this.capturedTokens.workflowToken) {
            this.capturedTokens.workflowToken = token;
          }
        }
      } catch (e) {
        console.log(chalk.yellow(`⚠️ Could not decode token from ${url}`));
      }
    }
  }

  async extractTokensFromResponse(responseData, url) {
    // Look for tokens in response data
    const tokenFields = ['token', 'access_token', 'id_token', 'jwt'];
    
    for (const field of tokenFields) {
      if (responseData[field]) {
        this.extractTokenFromString(responseData[field], url);
      }
    }
    
    // Extract location IDs if present
    if (url.includes('location_id=')) {
      const locationMatch = url.match(/location_id=([^&]+)/);
      if (locationMatch) {
        const locationIds = locationMatch[1].split(',');
        locationIds.forEach(id => {
          if (!this.capturedTokens.locationIds.includes(id)) {
            this.capturedTokens.locationIds.push(id);
          }
        });
        console.log(chalk.blue(`📍 Location IDs found: ${locationIds.join(', ')}`));
      }
    }
  }

  extractTokenFromString(tokenString, source) {
    try {
      if (tokenString.includes('.')) {
        const decoded = jwtDecode(tokenString);
        const expiresAt = new Date(decoded.exp * 1000);
        
        console.log(chalk.cyan(`🔓 JWT from response: expires at ${expiresAt.toISOString()}`));
        
        if (!this.capturedTokens.sessionToken || tokenString.length > this.capturedTokens.sessionToken.length) {
          this.capturedTokens.sessionToken = tokenString;
          this.capturedTokens.expiresAt = expiresAt;
        }
        
        if (!this.capturedTokens.apiTokens.includes(tokenString)) {
          this.capturedTokens.apiTokens.push(tokenString);
        }
      }
    } catch (e) {
      // Not a valid JWT, might be another type of token
      console.log(chalk.yellow(`⚠️ Non-JWT token in response from ${source}`));
    }
  }

  hasValidTokens() {
    return this.capturedTokens.sessionToken && 
           this.capturedTokens.expiresAt &&
           this.capturedTokens.expiresAt > new Date() &&
           this.capturedTokens.locationIds.length > 0;
  }

  async saveTokens() {
    console.log(chalk.blue('💾 Saving captured tokens...'));
    
    const tokenData = {
      GHL: {
        TOKEN: this.capturedTokens.sessionToken,
        TOKEN_TYPE: "admin_user",
        LOCATION_IDS: this.capturedTokens.locationIds,
        EXPIRES_AT: this.capturedTokens.expiresAt.toISOString(),
        CAPTURED_AT: new Date().toISOString(),
        API_TOKENS: this.capturedTokens.apiTokens.slice(0, 3), // Keep top 3 API tokens
        WORKFLOW_TOKEN: this.capturedTokens.workflowToken
      }
    };
    
    // Save to local file (for testing)
    const outputFile = path.join(__dirname, 'captured-tokens.json');
    await fs.writeJson(outputFile, tokenData, { spaces: 2 });
    
    console.log(chalk.green(`✅ Tokens saved to: ${outputFile}`));
    console.log(chalk.blue('📊 Token Summary:'));
    console.log(chalk.yellow(`   Session Token: ${this.capturedTokens.sessionToken.substring(0, 30)}...`));
    console.log(chalk.yellow(`   Expires At: ${this.capturedTokens.expiresAt.toISOString()}`));
    console.log(chalk.yellow(`   Location IDs: ${this.capturedTokens.locationIds.join(', ')}`));
    console.log(chalk.yellow(`   API Tokens: ${this.capturedTokens.apiTokens.length}`));
    
    console.log(chalk.green('\n🚀 Next Steps:'));
    console.log(chalk.white('   1. Copy tokens to your secure token storage (Google Secret Manager)'));
    console.log(chalk.white('   2. Start the token refresh service'));
    console.log(chalk.white('   3. Monitor token health and refresh success'));
  }

  async cleanup() {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
    
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI execution
if (require.main === module) {
  const authenticator = new GHLAuthenticator();
  
  authenticator.authenticate().then(success => {
    if (success) {
      console.log(chalk.green('\n🎉 Authentication completed successfully!'));
      console.log(chalk.blue('You can now set up automated token refresh.'));
      process.exit(0);
    } else {
      console.log(chalk.red('\n❌ Authentication failed.'));
      console.log(chalk.yellow('Please try again or check your GHL credentials.'));
      process.exit(1);
    }
  }).catch(error => {
    console.error(chalk.red('\n💥 Authentication error:'), error);
    process.exit(1);
  });
}

module.exports = GHLAuthenticator;