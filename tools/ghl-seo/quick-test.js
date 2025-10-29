#!/usr/bin/env node

/**
 * Quick API Tester for GoHighLevel
 *
 * Fast testing of discovered API endpoints
 * Use this when you find API calls in the browser
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class QuickAPITester {
  constructor() {
    this.apiKey = 'yrMl7UtmMqo31qLMP76W';
    this.baseURL = 'https://rest.gohighlevel.com/v1';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async testEndpoint(method, url, data = null, customHeaders = {}) {
    console.log(chalk.blue(`\n🧪 Testing: ${method} ${url}`));

    try {
      const config = {
        method: method.toUpperCase(),
        url,
        headers: { ...this.api.defaults.headers, ...customHeaders }
      };

      if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
        config.data = typeof data === 'string' ? JSON.parse(data) : data;
      }

      const response = await this.api.request(config);

      console.log(chalk.green(`✅ Success: ${response.status} ${response.statusText}`));
      console.log(chalk.gray('Response:'), JSON.stringify(response.data, null, 2));

      return { success: true, response: response.data };

    } catch (error) {
      console.log(chalk.red(`❌ Failed: ${error.response?.status || 'Network Error'}`));
      if (error.response?.data) {
        console.log(chalk.gray('Error:'), JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(chalk.gray('Error:'), error.message);
      }

      return { success: false, error: error.message };
    }
  }

  async saveWorkingEndpoint(method, url, data, response) {
    const endpoint = {
      method: method.toUpperCase(),
      url,
      requestData: data,
      response,
      timestamp: new Date().toISOString()
    };

    try {
      const filePath = path.join('./scraped-data', 'working-apis.json');
      let existing = [];
      try {
        const content = await fs.readFile(filePath, 'utf8');
        existing = JSON.parse(content);
      } catch (e) {
        // File doesn't exist yet
      }

      existing.push(endpoint);
      await fs.writeFile(filePath, JSON.stringify(existing, null, 2));

      console.log(chalk.green(`💾 Saved working endpoint to working-apis.json`));
    } catch (error) {
      console.log(chalk.red('Failed to save endpoint:', error.message));
    }
  }

  showCommonEndpoints() {
    console.log(chalk.cyan('\n📋 Common GoHighLevel API Patterns to Try:\n'));

    const patterns = [
      {
        name: 'Get Location Info',
        method: 'GET',
        url: '/locations',
        description: 'Get basic location/account info'
      },
      {
        name: 'Get Websites',
        method: 'GET',
        url: '/websites',
        description: 'List all websites'
      },
      {
        name: 'Get Website Pages',
        method: 'GET',
        url: '/websites/{website_id}/pages',
        description: 'List pages for a website'
      },
      {
        name: 'Update Page',
        method: 'PUT',
        url: '/websites/pages/{page_id}',
        description: 'Update page content/meta',
        data: {
          title: 'New Title',
          meta_description: 'New description'
        }
      },
      {
        name: 'Get Page Content',
        method: 'GET',
        url: '/websites/pages/{page_id}',
        description: 'Get page details'
      }
    ];

    patterns.forEach((pattern, index) => {
      console.log(`${index + 1}. ${chalk.yellow(pattern.name)}`);
      console.log(`   ${pattern.method} ${this.baseURL}${pattern.url}`);
      console.log(`   ${pattern.description}`);
      if (pattern.data) {
        console.log(`   Data: ${JSON.stringify(pattern.data)}`);
      }
      console.log('');
    });
  }

  showUsage() {
    console.log(chalk.green('\n🚀 Quick API Tester Usage:\n'));
    console.log('Test an endpoint:');
    console.log(chalk.cyan('  node quick-test.js GET /locations'));
    console.log(chalk.cyan('  node quick-test.js POST /websites/pages/123 \'{"title":"New Title"}\''));
    console.log('');

    console.log('Interactive mode:');
    console.log(chalk.cyan('  node quick-test.js interactive'));
    console.log('');

    console.log('Show common patterns:');
    console.log(chalk.cyan('  node quick-test.js patterns'));
    console.log('');
  }

  async run() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.showUsage();
      return;
    }

    const command = args[0].toLowerCase();

    switch (command) {
      case 'patterns':
        this.showCommonEndpoints();
        break;

      case 'interactive':
        await this.interactiveMode();
        break;

      default:
        // Direct endpoint test
        if (args.length >= 2) {
          const method = args[0];
          const url = args[1];
          const data = args[2] ? JSON.parse(args[2]) : null;

          const result = await this.testEndpoint(method, url, data);

          if (result.success) {
            await this.saveWorkingEndpoint(method, url, data, result.response);
          }
        } else {
          console.log(chalk.red('Invalid arguments. Use: method url [data]'));
          this.showUsage();
        }
    }
  }

  async interactiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.green('\n🎮 Interactive API Testing'));
    console.log(chalk.gray('Enter commands like: GET /locations'));
    console.log(chalk.gray('Or: POST /endpoint \'{"key":"value"}\''));
    console.log(chalk.gray('Type "help" for commands, "exit" to quit\n'));

    const askCommand = () => {
      rl.question(chalk.blue('API Test > '), async (input) => {
        const command = input.trim();

        if (command.toLowerCase() === 'exit') {
          rl.close();
          return;
        }

        if (command.toLowerCase() === 'help') {
          console.log(chalk.cyan('Commands:'));
          console.log('  GET /endpoint');
          console.log('  POST /endpoint \'{"data":"value"}\'');
          console.log('  PUT /endpoint \'{"data":"value"}\'');
          console.log('  patterns - Show common endpoints');
          console.log('  exit - Quit');
          askCommand();
          return;
        }

        if (command.toLowerCase() === 'patterns') {
          this.showCommonEndpoints();
          askCommand();
          return;
        }

        // Parse command
        const parts = command.split(' ');
        if (parts.length >= 2) {
          const method = parts[0];
          const url = parts[1];
          let data = null;

          if (parts.length >= 3) {
            try {
              data = JSON.parse(parts.slice(2).join(' '));
            } catch (e) {
              console.log(chalk.red('Invalid JSON data format'));
              askCommand();
              return;
            }
          }

          const result = await this.testEndpoint(method, url, data);

          if (result.success) {
            const save = await this.askToSave(rl);
            if (save) {
              await this.saveWorkingEndpoint(method, url, data, result.response);
            }
          }
        } else {
          console.log(chalk.red('Invalid command format'));
        }

        askCommand();
      });
    };

    askCommand();

    return new Promise((resolve) => {
      rl.on('close', resolve);
    });
  }

  askToSave(rl) {
    return new Promise((resolve) => {
      rl.question(chalk.yellow('Save this working endpoint? (y/n): '), (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new QuickAPITester();
  tester.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = QuickAPITester;