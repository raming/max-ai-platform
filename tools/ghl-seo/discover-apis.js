#!/usr/bin/env node

/**
 * GoHighLevel API Discovery Script
 *
 * Analyzes existing GHL integration patterns and provides guidance
 * for website modification APIs based on current knowledge
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

class GHLAPIDiscovery {
  constructor() {
    this.findings = {
      currentIntegrations: [],
      apiPatterns: [],
      recommendations: [],
      nextSteps: []
    };
  }

  async analyzeExistingIntegrations() {
    console.log(chalk.blue('🔍 Analyzing existing GHL integrations...\n'));

    const spinner = ora('Scanning workspace for GHL-related files...').start();

    try {
      // Look for GHL-related files in the workspace
      const ghlFiles = await this.findGHLFiles();
      this.findings.currentIntegrations = ghlFiles;

      spinner.succeed(`Found ${ghlFiles.length} GHL-related files`);

      // Analyze each file for API patterns
      for (const file of ghlFiles) {
        await this.analyzeFile(file);
      }

    } catch (error) {
      spinner.fail('Failed to analyze integrations');
      console.error(chalk.red('Error:'), error.message);
    }
  }

  async findGHLFiles() {
    const ghlFiles = [];

    try {
      // Check current directory and subdirectories
      const searchDirs = [
        '.',
        '../..', // Go up to max-ai root
        '../../platform' // Check platform directory
      ];

      for (const dir of searchDirs) {
        try {
          const files = await this.searchDirectory(dir);
          ghlFiles.push(...files);
        } catch (error) {
          // Directory might not exist, continue
          continue;
        }
      }
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not search all directories'));
    }

    return ghlFiles;
  }

  async searchDirectory(dir) {
    const ghlFiles = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        try {
          const subFiles = await this.searchDirectory(fullPath);
          ghlFiles.push(...subFiles);
        } catch (error) {
          continue;
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        const name = item.name.toLowerCase();

        // Look for GHL-related files
        if (ext === '.js' || ext === '.ts' || ext === '.py' || ext === '.json') {
          if (name.includes('ghl') || name.includes('gohighlevel') ||
              name.includes('highlevel') || this.containsGHLContent(fullPath)) {
            ghlFiles.push({
              path: fullPath,
              name: item.name,
              type: ext,
              category: this.categorizeFile(fullPath)
            });
          }
        }
      }
    }

    return ghlFiles;
  }

  async containsGHLContent(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lowerContent = content.toLowerCase();

      return lowerContent.includes('gohighlevel') ||
             lowerContent.includes('ghl') ||
             lowerContent.includes('highlevel') ||
             lowerContent.includes('app.1prompt.com') ||
             lowerContent.includes('maxaiassistant.com');
    } catch (error) {
      return false;
    }
  }

  categorizeFile(filePath) {
    const name = path.basename(filePath).toLowerCase();

    if (name.includes('api') || name.includes('integration')) return 'API Integration';
    if (name.includes('auth') || name.includes('login')) return 'Authentication';
    if (name.includes('website') || name.includes('page')) return 'Website Management';
    if (name.includes('seo') || name.includes('audit')) return 'SEO Tools';
    if (name.includes('config') || name.includes('.env')) return 'Configuration';

    return 'General';
  }

  async analyzeFile(fileInfo) {
    try {
      const content = await fs.readFile(fileInfo.path, 'utf8');

      // Look for API patterns
      const apiPatterns = this.extractAPIPatterns(content);
      if (apiPatterns.length > 0) {
        this.findings.apiPatterns.push({
          file: fileInfo.name,
          path: fileInfo.path,
          patterns: apiPatterns
        });
      }

      // Look for authentication patterns
      const authPatterns = this.extractAuthPatterns(content);
      if (authPatterns.length > 0) {
        this.findings.apiPatterns.push({
          file: fileInfo.name,
          path: fileInfo.path,
          patterns: authPatterns,
          type: 'authentication'
        });
      }

    } catch (error) {
      console.warn(chalk.yellow(`Could not analyze ${fileInfo.path}: ${error.message}`));
    }
  }

  extractAPIPatterns(content) {
    const patterns = [];

    // Look for API endpoints
    const apiRegex = /(?:https?:\/\/)?(?:[^\s'"]*gohighlevel\.com|[^\s'"]*1prompt\.com)[^\s'"]*api[^\s'"]*/gi;
    const apiMatches = content.match(apiRegex);
    if (apiMatches) {
      patterns.push(...apiMatches.map(match => ({ type: 'endpoint', value: match })));
    }

    // Look for fetch/axios calls
    const fetchRegex = /(?:fetch|axios)\(['"`]([^'"`]*api[^'"`]*?)['"`]/gi;
    const fetchMatches = content.match(fetchRegex);
    if (fetchMatches) {
      patterns.push(...fetchMatches.map(match => ({ type: 'fetch_call', value: match })));
    }

    // Look for API methods
    const methodRegex = /(?:GET|POST|PUT|DELETE|PATCH)\s+['"`]([^'"`]*?)['"`]/gi;
    const methodMatches = content.match(methodRegex);
    if (methodMatches) {
      patterns.push(...methodMatches.map(match => ({ type: 'http_method', value: match })));
    }

    return patterns;
  }

  extractAuthPatterns(content) {
    const patterns = [];

    // Look for authentication headers
    const authRegex = /(?:Authorization|Bearer|Token|API-Key)[^'"\n]*/gi;
    const authMatches = content.match(authRegex);
    if (authMatches) {
      patterns.push(...authMatches.map(match => ({ type: 'auth_header', value: match })));
    }

    // Look for session tokens
    const sessionRegex = /session[_-]?token|sessionId|session_id/gi;
    const sessionMatches = content.match(sessionRegex);
    if (sessionMatches) {
      patterns.push(...sessionMatches.map(match => ({ type: 'session_token', value: match })));
    }

    return patterns;
  }

  generateRecommendations() {
    console.log(chalk.blue('\n💡 Generating API discovery recommendations...\n'));

    // Based on current findings, provide recommendations
    if (this.findings.currentIntegrations.length === 0) {
      this.findings.recommendations.push({
        priority: 'high',
        title: 'No Existing GHL Integration Found',
        description: 'No existing GHL integration files found in the workspace',
        action: 'Need to explore GHL admin interface to understand available APIs'
      });
    }

    // Check for authentication patterns
    const hasAuth = this.findings.apiPatterns.some(p => p.type === 'authentication');
    if (!hasAuth) {
      this.findings.recommendations.push({
        priority: 'high',
        title: 'Authentication Method Unknown',
        description: 'No clear authentication patterns found',
        action: 'Explore GHL login process to understand authentication flow'
      });
    }

    // Check for API endpoints
    const hasEndpoints = this.findings.apiPatterns.some(p => p.patterns.some(pattern => pattern.type === 'endpoint'));
    if (!hasEndpoints) {
      this.findings.recommendations.push({
        priority: 'high',
        title: 'API Endpoints Unknown',
        description: 'No API endpoints discovered in existing code',
        action: 'Use browser developer tools to capture API calls during website editing'
      });
    }

    // Website modification recommendations
    this.findings.recommendations.push({
      priority: 'medium',
      title: 'Website Modification APIs',
      description: 'Need to identify APIs for updating page content, meta tags, and SEO elements',
      action: 'Navigate to website editor and monitor network requests'
    });

    this.findings.recommendations.push({
      priority: 'medium',
      title: 'Page Management APIs',
      description: 'Understand how to create, update, and delete pages programmatically',
      action: 'Explore page management interface and capture CRUD operations'
    });
  }

  generateNextSteps() {
    this.findings.nextSteps = [
      {
        step: 1,
        title: 'Manual GHL Admin Exploration',
        description: 'Navigate through GHL admin interface manually while monitoring network requests',
        tools: ['Browser Developer Tools', 'Network tab'],
        goal: 'Identify API endpoints for website management'
      },
      {
        step: 2,
        title: 'Authentication Analysis',
        description: 'Understand how GHL handles authentication and session management',
        tools: ['Browser DevTools Application tab', 'Session storage inspection'],
        goal: 'Determine best authentication method for API calls'
      },
      {
        step: 3,
        title: 'Page Editing Workflow',
        description: 'Go through the process of editing a page to capture all API calls',
        tools: ['Network monitoring', 'API request/response analysis'],
        goal: 'Map out complete page update workflow'
      },
      {
        step: 4,
        title: 'SEO-Specific APIs',
        description: 'Focus on APIs related to meta tags, titles, descriptions, and structured data',
        tools: ['Targeted network filtering', 'Request payload analysis'],
        goal: 'Identify endpoints for SEO element updates'
      },
      {
        step: 5,
        title: 'Build Integration Script',
        description: 'Create automated script using discovered API patterns',
        tools: ['Node.js', 'Axios/Fetch', 'Discovered API endpoints'],
        goal: 'Implement programmatic website updates'
      }
    ];
  }

  async saveFindings() {
    const spinner = ora('Saving API discovery findings...').start();

    try {
      const findingsPath = path.join('./scraped-data', 'api-discovery.json');
      await fs.writeFile(findingsPath, JSON.stringify(this.findings, null, 2));

      spinner.succeed('Findings saved');

    } catch (error) {
      spinner.fail('Failed to save findings');
      throw error;
    }
  }

  displayResults() {
    console.log(chalk.green('\n🎯 GHL API Discovery Results\n'));

    console.log(chalk.yellow('📁 Existing Integrations:'));
    if (this.findings.currentIntegrations.length === 0) {
      console.log(chalk.red('  No GHL integration files found'));
    } else {
      this.findings.currentIntegrations.forEach(file => {
        console.log(`  • ${file.name} (${file.category}) - ${file.path}`);
      });
    }

    console.log(chalk.yellow('\n🔗 API Patterns Found:'));
    if (this.findings.apiPatterns.length === 0) {
      console.log(chalk.red('  No API patterns discovered'));
    } else {
      this.findings.apiPatterns.forEach(pattern => {
        console.log(`  • ${pattern.file}:`);
        pattern.patterns.forEach(p => {
          console.log(`    - ${p.type}: ${p.value}`);
        });
      });
    }

    console.log(chalk.yellow('\n💡 Recommendations:'));
    this.findings.recommendations.forEach(rec => {
      const priorityColor = rec.priority === 'high' ? chalk.red : chalk.yellow;
      console.log(`${priorityColor('  • [' + rec.priority.toUpperCase() + ']')} ${rec.title}`);
      console.log(`    ${rec.description}`);
      console.log(`    Action: ${rec.action}\n`);
    });

    console.log(chalk.yellow('🚀 Next Steps:'));
    this.findings.nextSteps.forEach(step => {
      console.log(`  ${step.step}. ${step.title}`);
      console.log(`     ${step.description}`);
      console.log(`     Tools: ${step.tools.join(', ')}`);
      console.log(`     Goal: ${step.goal}\n`);
    });

    console.log(chalk.green('📄 Full results saved to: scraped-data/api-discovery.json'));
  }

  async run() {
    try {
      await this.analyzeExistingIntegrations();
      this.generateRecommendations();
      this.generateNextSteps();
      await this.saveFindings();
      this.displayResults();

    } catch (error) {
      console.error(chalk.red('\n❌ API Discovery failed:'), error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const discovery = new GHLAPIDiscovery();
  discovery.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = GHLAPIDiscovery;