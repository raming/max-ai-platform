#!/usr/bin/env node

/**
 * GHL Page Update Script - Fixed Version
 * 
 * This is a corrected version of update-pages.js with proper headers
 * Version header must be "1.0" as a string, not a number
 * 
 * Usage: node update-pages-fixed.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  tokenId: process.env.GHL_TOKEN || 'your-token-id-here',
  baseUrl: 'https://backend.leadconnectorhq.com',
  apiVersion: '1.0',  // ✅ IMPORTANT: Must be string, not number
  pageIds: process.env.GHL_PAGE_IDS ? process.env.GHL_PAGE_IDS.split(',') : [],
  verbose: process.env.VERBOSE === 'true'
};

class GHLPageUpdater {
  constructor(config) {
    this.config = config;
    this.results = {
      successful: [],
      failed: [],
      total: 0
    };
  }

  /**
   * Make API request with proper headers
   */
  async makeRequest(method, endpoint, data = null) {
    // ✅ CRITICAL: Headers setup with correct version format
    const headers = {
      'token-id': this.config.tokenId,
      'version': this.config.apiVersion,  // ✅ String: "1.0", not 1 or 1.0
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const url = `${this.config.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      if (this.config.verbose) {
        console.log(`\n📡 ${method} ${endpoint}`);
        console.log('Headers:', headers);
        if (data) console.log('Body:', JSON.stringify(data).substring(0, 100) + '...');
      }

      const response = await fetch(url, options);

      if (response.status === 401) {
        throw new Error('Unauthorized - Token may be expired or invalid');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error [${response.status}]: ${errorText}`);
      }

      const responseData = await response.json();
      
      if (this.config.verbose) {
        console.log('✅ Response:', JSON.stringify(responseData).substring(0, 100) + '...');
      }

      return responseData;
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get page details
   */
  async getPage(pageId) {
    return this.makeRequest('GET', `/page/${pageId}`);
  }

  /**
   * Update page
   */
  async updatePage(pageId, updateData) {
    return this.makeRequest('PUT', `/page/${pageId}`, updateData);
  }

  /**
   * Publish page
   */
  async publishPage(pageId) {
    return this.makeRequest('POST', `/page/${pageId}/publish`);
  }

  /**
   * Get all pages
   */
  async listPages() {
    return this.makeRequest('GET', '/page');
  }

  /**
   * Apply SEO improvements to page
   */
  async applySeOFix(pageId, seoData) {
    try {
      console.log(`\n🔧 Applying SEO fix to page: ${pageId}`);

      // Get current page
      const page = await this.getPage(pageId);
      console.log(`  Retrieved page: ${page.name || 'Unknown'}`);

      // Apply SEO improvements
      const updatePayload = {
        ...page,
        ...seoData
      };

      // Update page
      const updated = await this.updatePage(pageId, updatePayload);
      console.log(`✅ Updated page: ${pageId}`);

      // Optionally publish
      if (seoData.publish !== false) {
        await this.publishPage(pageId);
        console.log(`📤 Published page: ${pageId}`);
      }

      this.results.successful.push({
        pageId,
        status: 'success',
        timestamp: new Date().toISOString()
      });

      return updated;
    } catch (error) {
      console.error(`❌ Failed to update page ${pageId}: ${error.message}`);
      this.results.failed.push({
        pageId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Apply bulk SEO fixes
   */
  async applyBulkFixes(fixes) {
    console.log(`\n📋 Applying ${fixes.length} SEO fixes...\n`);
    this.results.total = fixes.length;

    for (let i = 0; i < fixes.length; i++) {
      const fix = fixes[i];
      process.stdout.write(`[${i + 1}/${fixes.length}] `);

      try {
        await this.applySeOFix(fix.pageId, fix.data);
      } catch (error) {
        // Continue with next fix even if one fails
      }

      // Rate limiting - avoid overwhelming API
      await new Promise(r => setTimeout(r, 500));
    }
  }

  /**
   * Print results summary
   */
  printResults() {
    console.log('\n\n📊 Summary');
    console.log('═══════════════════════════════');
    console.log(`✅ Successful: ${this.results.successful.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`📋 Total: ${this.results.total}`);
    console.log(`⏱️  Duration: ${Math.round(Date.now() / 1000)}s`);
    console.log('═══════════════════════════════');

    if (this.results.failed.length > 0) {
      console.log('\n⚠️  Failed Updates:');
      this.results.failed.forEach(f => {
        console.log(`  - ${f.pageId}: ${f.error}`);
      });
    }

    return this.results;
  }
}

/**
 * Example SEO fixes that can be applied
 */
const EXAMPLE_SEO_FIXES = [
  {
    pageId: 'page-1-id',
    data: {
      seoTitle: 'Best Digital Marketing Solutions | Max AI',
      seoDescription: 'Discover how Max AI helps businesses grow with AI-powered digital marketing strategies.',
      seoKeywords: 'digital marketing, AI, marketing automation'
    }
  },
  {
    pageId: 'page-2-id',
    data: {
      seoTitle: 'Contact Us | Max AI - Expert Digital Marketing',
      seoDescription: 'Get in touch with our digital marketing experts. Free consultation available.',
      seoKeywords: 'contact, consultation, digital marketing'
    }
  }
];

/**
 * Main execution
 */
async function main() {
  console.log('🚀 GHL Page Update Script - Fixed Version');
  console.log('=========================================\n');

  // Validate configuration
  if (CONFIG.tokenId === 'your-token-id-here') {
    console.error('❌ Error: GHL_TOKEN environment variable not set');
    console.error('Usage: GHL_TOKEN="your-token" node update-pages-fixed.js');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`  Token: ${CONFIG.tokenId.substring(0, 20)}...`);
  console.log(`  Version: ${CONFIG.apiVersion} ✅ (String, not number)`);
  console.log(`  Base URL: ${CONFIG.baseUrl}`);
  console.log('');

  const updater = new GHLPageUpdater(CONFIG);

  try {
    // Option 1: Apply example fixes
    if (CONFIG.pageIds.length === 0) {
      console.log('📝 No page IDs provided. Testing with example fixes...\n');
      console.log('ℹ️  Use: GHL_TOKEN="xxx" GHL_PAGE_IDS="id1,id2,id3" node update-pages-fixed.js');
      console.log('');

      // Test with current user first
      try {
        console.log('🧪 Testing API connection...');
        const user = await updater.makeRequest('GET', '/users/me');
        console.log(`✅ Connected as: ${user.email || user.name || 'Unknown'}`);
      } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
      }

      return;
    }

    // Option 2: Apply to specified page IDs
    console.log(`🎯 Updating ${CONFIG.pageIds.length} page(s)...\n`);
    
    const fixes = CONFIG.pageIds.map(pageId => ({
      pageId,
      data: {
        seoTitle: `Updated Page - ${new Date().toLocaleDateString()}`,
        seoDescription: 'Page optimized by Max AI SEO System',
        publish: true
      }
    }));

    await updater.applyBulkFixes(fixes);
    updater.printResults();

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GHLPageUpdater };
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
