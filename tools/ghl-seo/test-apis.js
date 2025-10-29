#!/usr/bin/env node

/**
 * GoHighLevel API Tester
 *
 * Test discovered API endpoints and validate authentication
 * Use this after manually discovering APIs through browser exploration
 */

require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs').promises;
const path = require('path');

class GHLAPITester {
  constructor() {
    this.config = {
      apiKey: process.env.GHL_API_KEY,
      locationId: process.env.GHL_LOCATION_ID,
      sessionToken: process.env.GHL_SESSION_TOKEN,
      adminUrl: process.env.GHL_ADMIN_URL
    };

    this.api = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    this.discoveredEndpoints = [];
    this.testResults = [];
  }

  async loadDiscoveredAPIs() {
    try {
      const discoveryPath = path.join('./scraped-data', 'discovered-apis.json');
      const data = await fs.readFile(discoveryPath, 'utf8');
      this.discoveredEndpoints = JSON.parse(data);
      console.log(chalk.green(`Loaded ${this.discoveredEndpoints.length} discovered API endpoints`));
    } catch (error) {
      console.log(chalk.yellow('No discovered APIs file found. You can add endpoints manually.'));
      this.discoveredEndpoints = [];
    }
  }

  async testBasicAuthentication() {
    console.log(chalk.blue('\n🔐 Testing Basic Authentication...\n'));

    const tests = [
      {
        name: 'API Key Authentication',
        method: 'GET',
        url: 'https://rest.gohighlevel.com/v1/locations',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      },
      {
        name: 'Session Token Authentication',
        method: 'GET',
        url: 'https://rest.gohighlevel.com/v1/me',
        headers: {
          'Authorization': `Bearer ${this.config.sessionToken}`
        }
      }
    ];

    for (const test of tests) {
      const spinner = ora(`Testing ${test.name}...`).start();

      try {
        const response = await this.api.request({
          method: test.method,
          url: test.url,
          headers: test.headers
        });

        spinner.succeed(`${test.name}: ${response.status} ${response.statusText}`);
        this.testResults.push({
          test: test.name,
          status: 'success',
          response: {
            status: response.status,
            data: response.data
          }
        });

      } catch (error) {
        spinner.fail(`${test.name}: Failed`);
        this.testResults.push({
          test: test.name,
          status: 'failed',
          error: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : null
        });
      }
    }
  }

  async testWebsiteAPIs() {
    console.log(chalk.blue('\n🌐 Testing Website Management APIs...\n'));

    // Common GHL website API patterns to test
    const websiteTests = [
      {
        name: 'Get Websites',
        method: 'GET',
        url: `https://rest.gohighlevel.com/v1/locations/${this.config.locationId}/websites`,
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      },
      {
        name: 'Get Pages',
        method: 'GET',
        url: `https://rest.gohighlevel.com/v1/websites/${this.config.locationId}/pages`,
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      },
      {
        name: 'Get Website Settings',
        method: 'GET',
        url: `https://rest.gohighlevel.com/v1/websites/${this.config.locationId}`,
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      }
    ];

    for (const test of websiteTests) {
      const spinner = ora(`Testing ${test.name}...`).start();

      try {
        const response = await this.api.request({
          method: test.method,
          url: test.url,
          headers: test.headers
        });

        spinner.succeed(`${test.name}: ${response.status}`);
        this.testResults.push({
          test: test.name,
          status: 'success',
          url: test.url,
          method: test.method,
          response: {
            status: response.status,
            dataSize: JSON.stringify(response.data).length
          }
        });

      } catch (error) {
        spinner.fail(`${test.name}: Failed`);
        this.testResults.push({
          test: test.name,
          status: 'failed',
          url: test.url,
          method: test.method,
          error: error.message
        });
      }
    }
  }

  async testCustomEndpoint(endpoint) {
    const spinner = ora(`Testing custom endpoint: ${endpoint.url}...`).start();

    try {
      const response = await this.api.request({
        method: endpoint.method || 'GET',
        url: endpoint.url,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...endpoint.headers
        },
        data: endpoint.data
      });

      spinner.succeed(`${endpoint.name || endpoint.url}: ${response.status}`);
      return {
        endpoint: endpoint.url,
        status: 'success',
        response: response.data
      };

    } catch (error) {
      spinner.fail(`${endpoint.name || endpoint.url}: Failed`);
      return {
        endpoint: endpoint.url,
        status: 'failed',
        error: error.message
      };
    }
  }

  async interactiveTesting() {
    console.log(chalk.green('\n🎮 Interactive API Testing Mode'));
    console.log(chalk.yellow('Commands:'));
    console.log('  test <method> <url> - Test a custom API endpoint');
    console.log('  auth - Test authentication methods');
    console.log('  website - Test website management APIs');
    console.log('  save - Save current test results');
    console.log('  exit - Exit interactive mode');
    console.log('');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askCommand = () => {
      rl.question(chalk.blue('API Tester > '), async (command) => {
        const parts = command.trim().split(' ');
        const action = parts[0].toLowerCase();

        try {
          switch (action) {
            case 'exit':
              rl.close();
              return;

            case 'test':
              if (parts.length < 3) {
                console.log(chalk.red('Usage: test <method> <url>'));
              } else {
                const method = parts[1].toUpperCase();
                const url = parts.slice(2).join(' ');
                const result = await this.testCustomEndpoint({ method, url });
                console.log(JSON.stringify(result, null, 2));
              }
              break;

            case 'auth':
              await this.testBasicAuthentication();
              break;

            case 'website':
              await this.testWebsiteAPIs();
              break;

            case 'save':
              await this.saveResults();
              console.log(chalk.green('Results saved!'));
              break;

            default:
              console.log(chalk.red('Unknown command. Type "help" for available commands.'));
          }

          askCommand();
        } catch (error) {
          console.error(chalk.red('Command error:'), error.message);
          askCommand();
        }
      });
    };

    askCommand();

    return new Promise((resolve) => {
      rl.on('close', resolve);
    });
  }

  async saveResults() {
    const resultsPath = path.join('./scraped-data', 'api-test-results.json');
    const data = {
      timestamp: new Date().toISOString(),
      config: {
        hasApiKey: !!this.config.apiKey,
        hasLocationId: !!this.config.locationId,
        hasSessionToken: !!this.config.sessionToken
      },
      results: this.testResults
    };

    await fs.writeFile(resultsPath, JSON.stringify(data, null, 2));
  }

  displayResults() {
    console.log(chalk.green('\n📊 API Testing Results\n'));

    const successful = this.testResults.filter(r => r.status === 'success').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;

    console.log(chalk.blue(`Total Tests: ${this.testResults.length}`));
    console.log(chalk.green(`Successful: ${successful}`));
    console.log(chalk.red(`Failed: ${failed}\n`));

    if (this.testResults.length > 0) {
      console.log(chalk.yellow('Test Details:'));
      this.testResults.forEach(result => {
        const status = result.status === 'success' ? chalk.green('✅') : chalk.red('❌');
        console.log(`${status} ${result.test}`);
        if (result.status === 'failed') {
          console.log(`   Error: ${result.error}`);
        }
      });
    }

    console.log(chalk.green('\n💡 Next Steps:'));
    if (successful > 0) {
      console.log('  • Working APIs found! Update update-pages.js with these endpoints');
      console.log('  • Test page update operations with discovered APIs');
    }
    if (failed > 0) {
      console.log('  • Some APIs failed - check authentication or endpoints');
      console.log('  • Try different authentication methods');
    }
    console.log('  • Use interactive mode to test custom endpoints');
  }

  async run() {
    try {
      console.log(chalk.bold.blue('🧪 GoHighLevel API Tester'));
      console.log(chalk.gray('==============================\n'));

      await this.loadDiscoveredAPIs();

      // Run basic tests
      await this.testBasicAuthentication();
      await this.testWebsiteAPIs();

      // Save initial results
      await this.saveResults();

      // Display results
      this.displayResults();

      // Enter interactive mode
      console.log(chalk.green('\n🎮 Entering interactive testing mode...'));
      console.log(chalk.gray('Type "exit" to quit\n'));

      await this.interactiveTesting();

    } catch (error) {
      console.error(chalk.red('\n❌ API Testing failed:'), error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new GHLAPITester();
  tester.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = GHLAPITester;