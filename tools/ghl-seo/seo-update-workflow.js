#!/usr/bin/env node

/**
 * Complete SEO Update Workflow
 * 
 * 1. Fetches pages from GHL
 * 2. Applies SEO optimizations (meta tags, keywords, H1s)
 * 3. Updates pages via API
 * 4. Reports results
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const https = require('https');

class SEOUpdateWorkflow {
  constructor() {
    this.token = process.env.GHL_TOKEN;
    this.locationId = process.env.GHL_LOCATION_ID;
    this.websiteId = process.env.GHL_WEBSITE_ID;
    this.apiVersion = process.env.GHL_API_VERSION || '2021-07-28';

    if (!this.token || !this.locationId || !this.websiteId) {
      throw new Error('Missing required environment variables: GHL_TOKEN, GHL_LOCATION_ID, GHL_WEBSITE_ID');
    }

    this.results = {
      timestamp: new Date().toISOString(),
      fetched: [],
      updated: [],
      failed: [],
      summary: {}
    };
  }

  // Make API request
  async request(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const headers = {
        'token-id': this.token,
        'version': this.apiVersion,
        'channel': 'APP',
        'source': 'WEB_USER',
        'accept': 'application/json',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0'
      };

      const url = new URL(endpoint, 'https://backend.leadconnectorhq.com');
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: method,
        headers: headers,
        timeout: 10000
      };

      let body = null;
      if (data && (method === 'POST' || method === 'PUT')) {
        body = JSON.stringify(data);
        headers['Content-Length'] = Buffer.byteLength(body);
      }

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`[${res.statusCode}] ${responseBody}`));
          }
          try {
            resolve(responseBody ? JSON.parse(responseBody) : null);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) req.write(body);
      req.end();
    });
  }

  // Fetch pages from GHL
  async fetchPages() {
    try {
      console.log(chalk.bold.cyan('\n📥 Fetching Pages from GHL\n'));

      const endpoint = `/funnels/page?locationId=${this.locationId}&funnelId=${this.websiteId}&limit=20&offset=0`;
      const response = await this.request('GET', endpoint);

      let pages = [];
      if (Array.isArray(response)) {
        pages = response;
      } else if (response.data) {
        pages = Array.isArray(response.data) ? response.data : [response.data];
      } else if (response.pages) {
        pages = response.pages;
      }

      console.log(chalk.green(`✓ Found ${pages.length} pages\n`));
      this.results.fetched = pages;
      return pages;

    } catch (error) {
      console.error(chalk.red('❌ Error fetching pages:'), error.message);
      throw error;
    }
  }

  // Generate SEO optimizations for a page
  generateOptimization(page) {
    const cleanTitle = (page.name || page.title || '').replace(/Path|Group|saved replies/gi, '').trim();

    const optimizations = {
      'auto-repair': {
        seoTitle: 'Auto Repair Services | AI-Powered Local Solutions',
        seoDescription: 'Professional auto repair with AI-powered customer engagement. Book appointments, get reviews, and grow locally.',
        h1: 'Expert Auto Repair with Smart AI Tools'
      },
      'carpet-cleaning': {
        seoTitle: 'Professional Carpet Cleaning | Local AI Marketing',
        seoDescription: 'Professional carpet cleaning with AI-powered booking. Get more jobs with smart marketing solutions.',
        h1: 'Expert Carpet Cleaning with AI Convenience'
      },
      'hvac': {
        seoTitle: 'HVAC Services | AI-Enhanced Local Solutions',
        seoDescription: 'HVAC heating and cooling services with AI-powered lead generation. Increase customer engagement.',
        h1: 'Reliable HVAC Services with AI Customer Connection'
      },
      'electrician': {
        seoTitle: 'Licensed Electrician | Local AI Marketing Solutions',
        seoDescription: 'Local electrician services enhanced with AI tools. Get more customers with intelligent lead management.',
        h1: 'Professional Electrician Services in Your Area'
      },
      'homepage': {
        seoTitle: 'AI Assistant & Local SEO Solutions | Max AI',
        seoDescription: 'AI-powered local SEO and reputation management. Boost your business with intelligent customer engagement.',
        h1: 'AI-Powered Local Business Growth Platform'
      }
    };

    // Try to find matching optimization
    for (const [key, opt] of Object.entries(optimizations)) {
      if (cleanTitle.toLowerCase().includes(key)) {
        return opt;
      }
    }

    // Default optimization
    return {
      seoTitle: `${cleanTitle} | AI-Powered Local Solutions`,
      seoDescription: `Get more ${cleanTitle} customers with AI marketing tools and local SEO solutions.`,
      h1: `${cleanTitle} with AI Advantage`
    };
  }

  // Update a single page with SEO data
  async updatePage(page) {
    try {
      const optimization = this.generateOptimization(page);

      const updatePayload = {
        ...page,
        seo: {
          title: optimization.seoTitle,
          description: optimization.seoDescription,
          keywords: 'ai assistant, local seo, ai marketing tools, reputation management software'
        },
        htmlStructured: `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          'name': page.name || page.title,
          'description': optimization.seoDescription,
          'areaServed': 'Local',
          'knowsAbout': ['Customer Service', 'AI Technology', 'Local Marketing']
        })}</script>`,
        heading1: optimization.h1
      };

      // Use _id field for GHL funnel pages
      const pageId = page._id || page.id;
      const endpoint = `/funnels/page/${pageId}`;
      await this.request('PUT', endpoint, updatePayload);

      this.results.updated.push({
        pageId: page._id || page.id,
        pageTitle: page.name || page.title,
        seoTitle: optimization.seoTitle,
        status: 'success'
      });

      return true;

    } catch (error) {
      this.results.failed.push({
        pageId: page._id || page.id,
        pageTitle: page.name || page.title,
        error: error.message
      });
      return false;
    }
  }

  // Main workflow
  async run() {
    try {
      console.log(chalk.bold.cyan('🚀 SEO Update Workflow\n'));
      console.log(chalk.gray(`Location ID: ${this.locationId}`));
      console.log(chalk.gray(`Website ID: ${this.websiteId}\n`));

      // Fetch pages
      const pages = await this.fetchPages();

      // Update pages
      console.log(chalk.bold.cyan('📝 Updating Pages with SEO Data\n'));
      let updated = 0;
      let failed = 0;

      for (const page of pages.slice(0, 10)) {
        // Limit to first 10 for testing
        process.stdout.write(`Updating ${page.name || page.title}... `);
        const success = await this.updatePage(page);
        if (success) {
          console.log(chalk.green('✓'));
          updated++;
        } else {
          console.log(chalk.red('✗'));
          failed++;
        }
      }

      // Summary
      console.log(chalk.bold.cyan('\n📊 Update Summary\n'));
      console.log(chalk.green(`✓ Successfully updated: ${updated} pages`));
      console.log(chalk.red(`✗ Failed: ${failed} pages`));

      if (updated > 0) {
        console.log(chalk.blue(`\n💡 Next: Run SEO audit to verify improvements`));
        console.log(chalk.blue(`   $ node seo-audit.js\n`));
      }

      // Save results
      const resultsPath = path.join(__dirname, 'scraped-data', 'seo-update-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
      console.log(chalk.gray(`Results saved: ${resultsPath}\n`));

    } catch (error) {
      console.error(chalk.red('Fatal error:'), error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const workflow = new SEOUpdateWorkflow();
  workflow.run();
}

module.exports = SEOUpdateWorkflow;
