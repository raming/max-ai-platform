#!/usr/bin/env node

/**
 * GoHighLevel Admin Explorer
 *
 * Launches Puppeteer browser for manual API discovery
 * User can login and navigate while we capture network requests
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class AdminExplorer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.requests = [];
    this.apiCalls = [];
  }

  async launchBrowser() {
    console.log(chalk.blue('🚀 Launching Puppeteer browser for API discovery...'));

    try {
      this.browser = await puppeteer.launch({
        headless: false, // Keep browser visible for manual interaction
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

      // Enable request interception to capture API calls
      await this.page.setRequestInterception(true);

      // Capture all requests
      this.page.on('request', (request) => {
        const url = request.url();
        const method = request.method();

        // Focus on API calls
        if (url.includes('/api/') || url.includes('/v1/') || url.includes('gohighlevel.com')) {
          const apiCall = {
            method,
            url,
            headers: request.headers(),
            timestamp: new Date().toISOString(),
            resourceType: request.resourceType()
          };

          // Capture POST/PUT data if available
          if ((method === 'POST' || method === 'PUT') && request.postData()) {
            apiCall.postData = request.postData();
          }

          this.apiCalls.push(apiCall);
          console.log(chalk.cyan(`📡 API Call: ${method} ${url}`));
        }

        request.continue();
      });

      // Capture responses
      this.page.on('response', (response) => {
        const url = response.url();
        const status = response.status();

        if (url.includes('/api/') || url.includes('/v1/') || url.includes('gohighlevel.com')) {
          console.log(chalk.green(`📥 Response: ${status} ${url}`));
        }
      });

      console.log(chalk.green('✅ Browser launched successfully!'));
      console.log(chalk.yellow('🌐 Navigating to GoHighLevel admin...'));

      await this.page.goto('https://app.1prompt.com', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      console.log(chalk.green('✅ Page loaded!'));
      console.log(chalk.blue('\n📋 Instructions:'));
      console.log('1. Login manually using your GHL credentials');
      console.log('2. Navigate to Websites/Pages section');
      console.log('3. Edit a page to trigger API calls');
      console.log('4. Watch the console for captured API requests');
      console.log('5. Press Ctrl+C when done to save captured APIs\n');

      // Keep browser open for manual interaction
      await this.keepAlive();

    } catch (error) {
      console.error(chalk.red('❌ Failed to launch browser:'), error.message);
      process.exit(1);
    }
  }

  async keepAlive() {
    // Keep the process alive until user interrupts
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Saving captured API calls...'));
      await this.saveCapturedAPIs();
      await this.browser.close();
      console.log(chalk.green('✅ Browser closed. Check api-discovery-results.json for captured endpoints!'));
      process.exit(0);
    });

    // Keep alive loop
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async saveCapturedAPIs() {
    try {
      const outputDir = path.join('./scraped-data');
      await fs.mkdir(outputDir, { recursive: true });

      const filePath = path.join(outputDir, 'api-discovery-results.json');

      const results = {
        timestamp: new Date().toISOString(),
        totalRequests: this.apiCalls.length,
        apiCalls: this.apiCalls,
        summary: {
          uniqueEndpoints: [...new Set(this.apiCalls.map(call => call.url))].length,
          methods: [...new Set(this.apiCalls.map(call => call.method))],
          domains: [...new Set(this.apiCalls.map(call => new URL(call.url).hostname))]
        }
      };

      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      console.log(chalk.green(`💾 Saved ${this.apiCalls.length} API calls to ${filePath}`));

      // Also save a simplified version for quick reference
      const simplified = this.apiCalls.map(call => ({
        method: call.method,
        url: call.url,
        hasData: !!call.postData
      }));

      const simplePath = path.join(outputDir, 'api-endpoints-simple.json');
      await fs.writeFile(simplePath, JSON.stringify(simplified, null, 2));
      console.log(chalk.green(`💾 Saved simplified endpoints to ${simplePath}`));

    } catch (error) {
      console.error(chalk.red('Failed to save API calls:'), error.message);
    }
  }

  async run() {
    console.log(chalk.green('🔍 GoHighLevel Admin API Discovery Tool'));
    console.log(chalk.gray('This will launch a browser for manual exploration\n'));

    await this.launchBrowser();
  }
}

// Run if called directly
if (require.main === module) {
  const explorer = new AdminExplorer();
  explorer.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = AdminExplorer;