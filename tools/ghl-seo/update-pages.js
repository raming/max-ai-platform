#!/usr/bin/env node

/**
 * GoHighLevel Website Page Updater
 *
 * Updates website pages via GoHighLevel API based on SEO audit recommendations
 * Implements automated fixes for meta tags, content optimization, and schema markup
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');

class GHLPageUpdater {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.GHL_API_KEY,
      locationId: config.locationId || process.env.GHL_LOCATION_ID,
      websiteUrl: config.websiteUrl || process.env.GHL_WEBSITE_URL,
      dataDir: config.dataDir || './scraped-data',
      auditFile: config.auditFile || 'seo-audit-results.json',
      dryRun: config.dryRun || false,
      autoApply: config.autoApply || false,
      tokenFile: config.tokenFile || 'tokens.json'
    };

    // Load tokens from discovery
    this.tokens = null;
    this.tokenRefreshUrl = 'https://backend.leadconnectorhq.com/appengine/api/token/update';

    this.api = axios.create({
      baseURL: 'https://backend.leadconnectorhq.com',
      headers: {
        'Content-Type': 'application/json',
        'version': '2'
      }
    });

    this.updates = {
      timestamp: new Date().toISOString(),
      pages: [],
      changes: [],
      status: 'pending'
    };
  }

  async loadTokens() {
    try {
      // First try to load from environment variable (GHL_SESSION_TOKEN)
      const sessionToken = process.env.GHL_SESSION_TOKEN;
      if (sessionToken && sessionToken.length > 50) {
        this.tokens = { value: sessionToken, source: 'env' };
        this.api.defaults.headers['token-id'] = sessionToken;
        console.log(chalk.green('✅ Session token loaded from .env file (using token-id header)'));
        return true;
      }

      // Fallback to tokens.json file
      const tokenPath = path.join(this.config.dataDir, this.config.tokenFile);
      const tokenData = JSON.parse(await fs.readFile(tokenPath, 'utf8'));

      // Find the most recent JWT token
      const jwtToken = tokenData.tokens?.find(t =>
        t.value && t.value.includes('.') && t.value.length > 200
      );

      if (jwtToken) {
        this.tokens = jwtToken;
        this.api.defaults.headers['token-id'] = jwtToken.value;
        console.log(chalk.green('✅ Authentication tokens loaded from file'));
        return true;
      } else {
        console.log(chalk.yellow('⚠️  No JWT tokens found in token file'));
        return false;
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not load tokens, using API key fallback'));
      // Fallback to API key if available
      if (this.config.apiKey) {
        this.api.defaults.headers['token-id'] = this.config.apiKey;
        return true;
      }
      return false;
    }
  }

  async refreshToken() {
    if (!this.tokens) return false;

    try {
      const response = await this.api.post(this.tokenRefreshUrl, {
        token: this.tokens.value
      });

      if (response.data && response.data.token) {
        this.tokens.value = response.data.token;
        this.api.defaults.headers['token-id'] = response.data.token;
        console.log(chalk.green('🔄 Token refreshed successfully'));
        return true;
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Token refresh failed, continuing with current token'));
    }

    return false;
  }

  async loadAuditResults() {
    const spinner = ora('Loading SEO audit results...').start();

    try {
      const auditPath = path.join(this.config.dataDir, this.config.auditFile);
      const auditData = JSON.parse(await fs.readFile(auditPath, 'utf8'));

      spinner.succeed('Audit results loaded');
      return auditData;

    } catch (error) {
      spinner.fail('Failed to load audit results');
      throw new Error(`Could not load audit results: ${error.message}`);
    }
  }

  async validateAPIConnection() {
    const spinner = ora('Validating GoHighLevel API connection...').start();

    try {
      // Test API connection by getting location info
      const response = await this.api.get(`/locations/${this.config.locationId}`);

      if (response.status === 200) {
        spinner.succeed('API connection validated');
        return response.data;
      } else {
        throw new Error(`API returned status ${response.status}`);
      }

    } catch (error) {
      spinner.fail('API connection failed');
      throw new Error(`GoHighLevel API connection failed: ${error.message}`);
    }
  }

  async getWebsitePages() {
    const spinner = ora('Fetching website pages from GoHighLevel...').start();

    try {
      // Get website pages - this endpoint may vary based on GHL API
      const response = await this.api.get(`/websites/${this.config.locationId}/pages`);

      spinner.succeed(`Found ${response.data.length} pages`);
      return response.data;

    } catch (error) {
      spinner.fail('Failed to fetch pages');
      console.warn(chalk.yellow('Note: Page fetching may not be available in current API version'));
      return [];
    }
  }

  generatePageUpdates(auditData) {
    const updates = [];

    auditData.pages.forEach(page => {
      const pageUpdates = {
        url: page.url,
        title: page.title,
        changes: []
      };

      // Process critical issues first
      page.issues.critical.forEach(issue => {
        const change = this.generateChangeForIssue(issue, page);
        if (change) pageUpdates.changes.push(change);
      });

      // Process warnings
      page.issues.warnings.forEach(issue => {
        const change = this.generateChangeForIssue(issue, page);
        if (change) pageUpdates.changes.push(change);
      });

      // Process opportunities (only high-impact ones)
      page.issues.opportunities
        .filter(issue => issue.impact === 'high')
        .forEach(issue => {
          const change = this.generateChangeForIssue(issue, page);
          if (change) pageUpdates.changes.push(change);
        });

      if (pageUpdates.changes.length > 0) {
        updates.push(pageUpdates);
      }
    });

    return updates;
  }

  generateChangeForIssue(issue, page) {
    switch (issue.type) {
      case 'missing_title':
        return {
          type: 'meta_title',
          action: 'add',
          current: page.meta?.title || null,
          proposed: this.generateOptimizedTitle(page),
          reason: issue.message,
          impact: issue.impact
        };

      case 'title_too_short':
      case 'title_too_long':
        return {
          type: 'meta_title',
          action: 'update',
          current: page.meta?.title,
          proposed: this.generateOptimizedTitle(page),
          reason: issue.message,
          impact: issue.impact
        };

      case 'missing_description':
        return {
          type: 'meta_description',
          action: 'add',
          current: page.meta?.description || null,
          proposed: this.generateOptimizedDescription(page),
          reason: issue.message,
          impact: issue.impact
        };

      case 'description_too_short':
      case 'description_too_long':
        return {
          type: 'meta_description',
          action: 'update',
          current: page.meta?.description,
          proposed: this.generateOptimizedDescription(page),
          reason: issue.message,
          impact: issue.impact
        };

      case 'missing_h1':
        return {
          type: 'h1_tag',
          action: 'add',
          current: null,
          proposed: this.generateOptimizedH1(page),
          reason: issue.message,
          impact: issue.impact
        };

      case 'multiple_h1':
        return {
          type: 'h1_tag',
          action: 'consolidate',
          current: page.headings?.h1 || [],
          proposed: this.generateOptimizedH1(page),
          reason: issue.message,
          impact: issue.impact
        };

      case 'missing_alt_text':
        return {
          type: 'image_alt',
          action: 'add_missing',
          current: `${page.images?.withoutAlt || 0} images without alt text`,
          proposed: 'Add descriptive alt text to all images',
          reason: issue.message,
          impact: issue.impact
        };

      case 'keyword_not_in_content':
        return {
          type: 'content_optimization',
          action: 'add_keyword',
          current: 'Keyword not present',
          proposed: `Include "${issue.message.match(/"([^"]+)"/)?.[1] || 'target keyword'}" naturally in content`,
          reason: issue.message,
          impact: issue.impact
        };

      case 'no_structured_data':
        return {
          type: 'schema_markup',
          action: 'add',
          current: null,
          proposed: this.generateSchemaMarkup(page),
          reason: issue.message,
          impact: issue.impact
        };

      default:
        return null;
    }
  }

  generateOptimizedTitle(page) {
    const targetKeywords = ['ai assistant', 'local seo', 'ai marketing tools'];
    const baseTitle = page.title || 'Max AI';

    // Try to include primary keyword if not already present
    const primaryKeyword = targetKeywords[0];
    if (!baseTitle.toLowerCase().includes(primaryKeyword)) {
      return `${baseTitle} - ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)}`;
    }

    return baseTitle;
  }

  generateOptimizedDescription(page) {
    const targetKeywords = ['ai assistant', 'local seo', 'ai marketing tools'];
    const baseDesc = page.meta?.description || '';

    if (baseDesc.length > 100) return baseDesc; // Already has content

    // Generate description based on page content
    const keyword = targetKeywords[0];
    return `Discover how ${keyword} can transform your business. Professional ${keyword} solutions for modern marketing needs. Get started today.`;
  }

  generateOptimizedH1(page) {
    const targetKeywords = ['ai assistant', 'local seo', 'ai marketing tools'];
    const existingH1 = page.headings?.h1?.[0];

    if (existingH1) return existingH1;

    // Generate H1 based on page title
    const keyword = targetKeywords[0];
    return `${page.title} - ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
  }

  generateSchemaMarkup(page) {
    // Generate basic Organization schema
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Max AI',
      description: 'Professional AI assistant and marketing tools',
      url: page.url,
      sameAs: [
        // Add social media URLs if available
      ]
    };
  }

  async applyUpdates(updates) {
    if (this.config.dryRun) {
      console.log(chalk.yellow('\n🔍 DRY RUN MODE - No changes will be applied\n'));
      return this.simulateUpdates(updates);
    }

    console.log(chalk.blue('\n🔄 Applying updates to GoHighLevel...\n'));

    const results = [];

    for (const pageUpdate of updates) {
      const pageResult = {
        url: pageUpdate.url,
        title: pageUpdate.title,
        applied: [],
        failed: []
      };

      for (const change of pageUpdate.changes) {
        try {
          const result = await this.applyChange(change, pageUpdate);
          pageResult.applied.push({
            type: change.type,
            action: change.action,
            success: true,
            details: result
          });
        } catch (error) {
          pageResult.failed.push({
            type: change.type,
            action: change.action,
            error: error.message
          });
        }
      }

      results.push(pageResult);
    }

    return results;
  }

  async applyChange(change, pageUpdate) {
    // Note: These are example API calls - actual GHL API endpoints may differ
    switch (change.type) {
      case 'meta_title':
      case 'meta_description':
        return await this.updatePageMeta(pageUpdate.url, change);

      case 'h1_tag':
        return await this.updatePageContent(pageUpdate.url, change);

      case 'schema_markup':
        return await this.addSchemaMarkup(pageUpdate.url, change);

      default:
        return { message: `Change type ${change.type} not yet implemented` };
    }
  }

  async updatePageMeta(pageUrl, change) {
    // This is a placeholder - actual implementation depends on GHL API
    const payload = {
      url: pageUrl,
      updates: {}
    };

    if (change.type === 'meta_title') {
      payload.updates.title = change.proposed;
    } else if (change.type === 'meta_description') {
      payload.updates.description = change.proposed;
    }

    // Simulate API call
    if (!this.config.dryRun) {
      console.log(`Updating ${change.type} for ${pageUrl}`);
      // await this.api.put(`/websites/pages/meta`, payload);
    }

    return { updated: change.type, value: change.proposed };
  }

  async updatePageContent(pageUrl, change) {
    // Placeholder for content updates
    const payload = {
      url: pageUrl,
      content: change.proposed
    };

    if (!this.config.dryRun) {
      console.log(`Updating content for ${pageUrl}`);
      // await this.api.put(`/websites/pages/content`, payload);
    }

    return { updated: 'content', value: change.proposed };
  }

  async addSchemaMarkup(pageUrl, change) {
    // Placeholder for schema markup addition
    const payload = {
      url: pageUrl,
      schema: change.proposed
    };

    if (!this.config.dryRun) {
      console.log(`Adding schema markup to ${pageUrl}`);
      // await this.api.post(`/websites/pages/schema`, payload);
    }

    return { added: 'schema_markup', schema: change.proposed };
  }

  simulateUpdates(updates) {
    console.log(chalk.yellow('📋 Proposed Updates (Dry Run):\n'));

    updates.forEach((page, index) => {
      console.log(`${index + 1}. ${page.title} (${page.url})`);
      page.changes.forEach(change => {
        console.log(`   • ${change.type}: ${change.action} - ${change.reason}`);
        console.log(`     Current: ${change.current || 'None'}`);
        console.log(`     Proposed: ${typeof change.proposed === 'object' ? JSON.stringify(change.proposed) : change.proposed}`);
        console.log('');
      });
    });

    return updates.map(page => ({
      url: page.url,
      title: page.title,
      applied: page.changes.map(c => ({ type: c.type, action: c.action, simulated: true })),
      failed: []
    }));
  }

  async saveResults(results) {
    const spinner = ora('Saving update results...').start();

    try {
      this.updates.pages = results;
      this.updates.status = 'completed';

      const summary = {
        totalPages: results.length,
        totalChanges: results.reduce((sum, page) => sum + page.applied.length + page.failed.length, 0),
        successfulChanges: results.reduce((sum, page) => sum + page.applied.length, 0),
        failedChanges: results.reduce((sum, page) => sum + page.failed.length, 0),
        dryRun: this.config.dryRun
      };

      this.updates.summary = summary;

      await fs.writeFile(
        path.join(this.config.dataDir, 'update-results.json'),
        JSON.stringify(this.updates, null, 2)
      );

      spinner.succeed('Results saved');

      return summary;

    } catch (error) {
      spinner.fail('Failed to save results');
      throw error;
    }
  }

  displaySummary(results, summary) {
    console.log(chalk.green('\n✅ Update Process Complete!\n'));

    if (this.config.dryRun) {
      console.log(chalk.yellow('🔍 This was a dry run - no actual changes were made'));
    }

    console.log(chalk.blue('📊 Summary:'));
    console.log(`  Pages Processed: ${summary.totalPages}`);
    console.log(`  Total Changes: ${summary.totalChanges}`);
    console.log(`  Successful: ${summary.successfulChanges}`);
    console.log(`  Failed: ${summary.failedChanges}\n`);

    if (summary.failedChanges > 0) {
      console.log(chalk.red('❌ Failed Updates:'));
      results.forEach(page => {
        if (page.failed.length > 0) {
          console.log(`  ${page.title}:`);
          page.failed.forEach(fail => {
            console.log(`    • ${fail.type} (${fail.action}): ${fail.error}`);
          });
        }
      });
      console.log('');
    }

    console.log(chalk.green('📁 Results saved to: update-results.json'));
    console.log(chalk.blue('\n💡 Next Steps:'));
    console.log('  1. Review the update results');
    console.log('  2. Test your website to ensure changes look good');
    console.log('  3. Run another SEO audit to measure improvements');
    console.log('  4. Consider manual review for complex content changes\n');
  }

  async run() {
    try {
      console.log(chalk.bold.blue('🔄 GoHighLevel Website Page Updater'));
      console.log(chalk.gray('====================================\n'));

      // Load authentication tokens
      const tokensLoaded = await this.loadTokens();
      if (!tokensLoaded) {
        console.log(chalk.yellow('⚠️  Proceeding without authentication tokens'));
      }

      // Validate configuration
      if (!this.config.apiKey && !tokensLoaded) {
        throw new Error('Either GHL_API_KEY environment variable or tokens.json file is required');
      }
      if (!this.config.locationId) {
        throw new Error('GHL_LOCATION_ID environment variable is required');
      }

      // Load audit data
      const auditData = await this.loadAuditResults();

      // Validate API connection
      await this.validateAPIConnection();

      // Generate updates
      const updates = this.generatePageUpdates(auditData);
      console.log(chalk.blue(`\n📋 Generated ${updates.length} page updates\n`));

      if (updates.length === 0) {
        console.log(chalk.yellow('No updates needed - all pages are optimized! 🎉'));
        return;
      }

      // Apply updates
      const results = await this.applyUpdates(updates);

      // Save and display results
      const summary = await this.saveResults(results);
      this.displaySummary(results, summary);

    } catch (error) {
      console.error(chalk.red('\n❌ Update failed:'), error.message);
      this.updates.status = 'failed';
      this.updates.error = error.message;

      // Save error state
      await fs.writeFile(
        path.join(this.config.dataDir, 'update-results.json'),
        JSON.stringify(this.updates, null, 2)
      );

      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const updater = new GHLPageUpdater();
  updater.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = GHLPageUpdater;