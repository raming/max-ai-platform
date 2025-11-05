#!/usr/bin/env node

/**
 * Fetch GHL Website Pages with Clean Data
 * 
 * Gets all pages from the GHL website with proper IDs for updating
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class GHLPageFetcher {
  constructor() {
    this.apiBaseUrl = process.env.GHL_API_BASE_URL || 'https://backend.leadconnectorhq.com';
    this.apiVersion = process.env.GHL_API_VERSION || '2021-07-28';
    this.token = process.env.GHL_TOKEN;
    this.locationId = process.env.GHL_LOCATION_ID;
    this.websiteId = process.env.GHL_WEBSITE_ID;

    if (!this.token) {
      throw new Error('GHL_TOKEN not set in .env');
    }

    this.api = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'version': this.apiVersion,
        'channel': 'APP',
        'source': 'WEB_USER',
        'Content-Type': 'application/json'
      }
    });
  }

  async fetchPages() {
    try {
      console.log(chalk.bold.cyan('\n🔄 Fetching GHL Pages...\n'));
      console.log(chalk.gray(`Location: ${this.locationId}`));
      console.log(chalk.gray(`Website: ${this.websiteId}\n`));

      // Endpoint to get website pages
      const endpoint = `/v4/websites/${this.websiteId}/pages`;

      const response = await this.api.get(endpoint);
      const pages = response.data.pages || response.data.data || response.data;

      console.log(chalk.green(`✓ Found ${pages.length} pages\n`));

      // Save pages with IDs
      const pagesWithIds = pages.map(page => ({
        id: page.id,
        title: page.title || page.name,
        slug: page.slug || page.urlPath,
        url: page.url || `https://maxaiassistant.com/${page.slug}`,
        seoTitle: page.seoTitle || '',
        seoDescription: page.seoDescription || '',
        content: page.content || ''
      }));

      // Display first 10 pages
      console.log(chalk.bold('📄 Pages (first 10):'));
      pagesWithIds.slice(0, 10).forEach((page, idx) => {
        console.log(`\n${idx + 1}. ${chalk.cyan(page.title)}`);
        console.log(`   ID: ${page.id}`);
        console.log(`   Slug: ${page.slug}`);
        console.log(`   URL: ${page.url}`);
      });

      if (pagesWithIds.length > 10) {
        console.log(chalk.gray(`\n... and ${pagesWithIds.length - 10} more pages`));
      }

      // Save to file
      const outputPath = path.join(__dirname, 'scraped-data', 'ghl-pages-with-ids.json');
      await fs.writeFile(outputPath, JSON.stringify(pagesWithIds, null, 2));
      console.log(chalk.green(`\n✓ Saved to: ${outputPath}\n`));

      return pagesWithIds;

    } catch (error) {
      console.error(chalk.red('❌ Error fetching pages:'));
      if (error.response?.status === 401) {
        console.error(chalk.red('Authentication failed - token may be expired'));
      } else if (error.response?.data) {
        console.error(chalk.red(JSON.stringify(error.response.data, null, 2)));
      } else {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  }

  async run() {
    try {
      await this.fetchPages();
    } catch (error) {
      console.error(chalk.red('Fatal error:'), error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const fetcher = new GHLPageFetcher();
  fetcher.run();
}

module.exports = GHLPageFetcher;
