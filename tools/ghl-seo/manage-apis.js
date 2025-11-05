#!/usr/bin/env node

/**
 * API Endpoint Manager
 *
 * Save and manage discovered GoHighLevel API endpoints
 * Use this to store endpoints found during manual exploration
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

class APIEndpointManager {
  constructor() {
    this.endpointsFile = path.join('./scraped-data', 'discovered-apis.json');
    this.endpoints = [];
  }

  async loadEndpoints() {
    try {
      const data = await fs.readFile(this.endpointsFile, 'utf8');
      this.endpoints = JSON.parse(data);
    } catch (error) {
      this.endpoints = [];
    }
  }

  async saveEndpoints() {
    const data = {
      timestamp: new Date().toISOString(),
      endpoints: this.endpoints
    };
    await fs.writeFile(this.endpointsFile, JSON.stringify(data, null, 2));
  }

  async addEndpoint(endpoint) {
    this.endpoints.push({
      id: Date.now().toString(),
      ...endpoint,
      discovered: new Date().toISOString()
    });
    await this.saveEndpoints();
    console.log(chalk.green(`✅ Endpoint saved: ${endpoint.name || endpoint.url}`));
  }

  displayEndpoints() {
    if (this.endpoints.length === 0) {
      console.log(chalk.yellow('No endpoints discovered yet.'));
      return;
    }

    console.log(chalk.blue('\n📋 Discovered API Endpoints:\n'));
    this.endpoints.forEach((endpoint, index) => {
      console.log(`${index + 1}. ${chalk.cyan(endpoint.name || 'Unnamed Endpoint')}`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Method: ${endpoint.method || 'GET'}`);
      console.log(`   Purpose: ${endpoint.purpose || 'Unknown'}`);
      console.log(`   Status: ${endpoint.tested ? '✅ Tested' : '⏳ Not tested'}\n`);
    });
  }

  async interactiveMode() {
    console.log(chalk.green('\n🎮 API Endpoint Manager'));
    console.log(chalk.yellow('Commands:'));
    console.log('  add - Add a new endpoint');
    console.log('  list - List all endpoints');
    console.log('  test - Test an endpoint');
    console.log('  template - Show endpoint template');
    console.log('  exit - Exit');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askCommand = () => {
      rl.question(chalk.blue('API Manager > '), async (command) => {
        const action = command.trim().toLowerCase();

        try {
          switch (action) {
            case 'exit':
              rl.close();
              return;

            case 'add':
              await this.addEndpointInteractive(rl);
              break;

            case 'list':
              this.displayEndpoints();
              break;

            case 'test':
              await this.testEndpointInteractive(rl);
              break;

            case 'template':
              this.showTemplate();
              break;

            default:
              console.log(chalk.red('Unknown command. Available: add, list, test, template, exit'));
          }

          askCommand();
        } catch (error) {
          console.error(chalk.red('Error:'), error.message);
          askCommand();
        }
      });
    };

    askCommand();

    return new Promise((resolve) => {
      rl.on('close', resolve);
    });
  }

  async addEndpointInteractive(rl) {
    return new Promise((resolve) => {
      console.log(chalk.cyan('\n📝 Add New API Endpoint\n'));

      const questions = [
        { key: 'name', question: 'Endpoint name (e.g., "Update Page Meta"): ' },
        { key: 'url', question: 'Full URL: ' },
        { key: 'method', question: 'HTTP Method (GET, POST, PUT, DELETE): ' },
        { key: 'purpose', question: 'Purpose (e.g., "Update page title and meta"): ' },
        { key: 'headers', question: 'Authorization header (or press enter): ' },
        { key: 'sampleRequest', question: 'Sample request body (JSON, or press enter): ' }
      ];

      let currentIndex = 0;
      const answers = {};

      const askQuestion = () => {
        if (currentIndex >= questions.length) {
          this.addEndpoint(answers);
          resolve();
          return;
        }

        const q = questions[currentIndex];
        rl.question(q.question, (answer) => {
          if (answer.trim()) {
            if (q.key === 'sampleRequest') {
              try {
                answers[q.key] = JSON.parse(answer);
              } catch (e) {
                answers[q.key] = answer;
              }
            } else {
              answers[q.key] = answer;
            }
          }
          currentIndex++;
          askQuestion();
        });
      };

      askQuestion();
    });
  }

  async testEndpointInteractive(rl) {
    return new Promise((resolve) => {
      if (this.endpoints.length === 0) {
        console.log(chalk.yellow('No endpoints to test. Add some first.'));
        resolve();
        return;
      }

      console.log(chalk.cyan('\n🧪 Test API Endpoint\n'));
      this.displayEndpoints();

      rl.question('Enter endpoint number to test: ', async (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < this.endpoints.length) {
          const endpoint = this.endpoints[index];
          console.log(chalk.blue(`Testing: ${endpoint.name || endpoint.url}`));

          // Here you could integrate with the test-apis.js functionality
          console.log(chalk.yellow('Use "npm run test-apis" for full testing capabilities'));
        } else {
          console.log(chalk.red('Invalid endpoint number'));
        }
        resolve();
      });
    });
  }

  showTemplate() {
    console.log(chalk.cyan('\n📋 API Endpoint Template\n'));
    console.log(chalk.yellow('When you discover an API call, capture:\n'));

    console.log(chalk.green('1. Basic Info:'));
    console.log('   Name: Update Page Title');
    console.log('   URL: https://api.gohighlevel.com/v1/websites/pages/123');
    console.log('   Method: PUT');
    console.log('   Purpose: Update page title and meta description\n');

    console.log(chalk.green('2. Headers:'));
    console.log('   Authorization: Bearer yrMl7UtmMqo31qLMP76W');
    console.log('   Content-Type: application/json\n');

    console.log(chalk.green('3. Request Body (for POST/PUT):'));
    console.log(`   {
     "title": "New Page Title",
     "meta_description": "New meta description",
     "seo_title": "SEO Title"
   }\n`);

    console.log(chalk.green('4. Response:'));
    console.log(`   {
     "success": true,
     "page": { "id": "123", "title": "Updated Title" }
   }\n`);

    console.log(chalk.blue('💡 Pro Tips:'));
    console.log('• Look for endpoints with "pages", "websites", or "content" in URL');
    console.log('• Focus on PUT/POST methods for updates');
    console.log('• Note any required headers or authentication');
    console.log('• Save the exact JSON structure used');
  }

  async run() {
    await this.loadEndpoints();

    console.log(chalk.bold.blue('📊 GoHighLevel API Endpoint Manager'));
    console.log(chalk.gray('=====================================\n'));

    if (this.endpoints.length > 0) {
      console.log(chalk.green(`Loaded ${this.endpoints.length} discovered endpoints\n`));
    }

    await this.interactiveMode();
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new APIEndpointManager();
  manager.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = APIEndpointManager;