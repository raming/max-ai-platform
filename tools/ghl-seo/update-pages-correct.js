#!/usr/bin/env node

/**
 * GHL Page Update Script - Properly Implemented
 * 
 * Updates pages with SEO improvements using correct API patterns
 * Uses the corrected GHLAPIClient
 * 
 * Usage:
 *   GHL_TOKEN="your-token" node update-pages-correct.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const GHLAPIClient = require('./ghl-api-client');

class PageUpdater {
  constructor() {
    const token = process.env.GHL_TOKEN;
    if (!token) {
      console.error('❌ Error: GHL_TOKEN environment variable not set');
      process.exit(1);
    }

    this.client = new GHLAPIClient(token, {
      verbose: process.env.VERBOSE === 'true'
    });

    this.results = {
      timestamp: new Date().toISOString(),
      updated: [],
      failed: [],
      skipped: []
    };
  }

  /**
   * Generate SEO update payload for a page
   */
  generateSEOPayload(page, seoData) {
    // ✅ CORRECT: Build proper update payload that matches GHL API
    const payload = {
      // Preserve existing page data
      ...page,

      // Update SEO fields
      seo: {
        title: seoData.title || page.seo?.title,
        description: seoData.description || page.seo?.description,
        keywords: seoData.keywords || page.seo?.keywords,
        canonical: seoData.canonical || page.seo?.canonical
      },

      // Update heading structure
      headings: {
        h1: seoData.h1 || page.headings?.h1,
        h2: seoData.h2 || page.headings?.h2 || [],
        h3: seoData.h3 || page.headings?.h3 || []
      }
    };

    // Add schema if provided
    if (seoData.schema) {
      payload.schema = seoData.schema;
    }

    // Add social tags if provided
    if (seoData.social) {
      payload.social = {
        ogTitle: seoData.social.ogTitle || page.social?.ogTitle,
        ogDescription: seoData.social.ogDescription || page.social?.ogDescription,
        ogImage: seoData.social.ogImage || page.social?.ogImage
      };
    }

    return payload;
  }

  /**
   * Update a single page
   */
  async updatePage(pageId, seoData) {
    try {
      // Step 1: Get current page data
      console.log(`\n📄 Fetching page: ${pageId}`);
      const currentPage = await this.client.getPage(pageId);
      
      if (!currentPage) {
        throw new Error('Page not found');
      }

      console.log(`   Title: ${currentPage.name || currentPage.seo?.title || '[No title]'}`);

      // Step 2: Generate update payload
      const updatePayload = this.generateSEOPayload(currentPage, seoData);

      // Step 3: Apply update
      console.log(`   ✏️  Updating SEO data...`);
      const updated = await this.client.updatePage(pageId, updatePayload);

      // Step 4: Publish changes
      console.log(`   📤 Publishing page...`);
      await this.client.publishPage(pageId);

      console.log(`   ✅ Page updated successfully!`);

      this.results.updated.push({
        pageId,
        title: currentPage.name,
        changes: {
          title: seoData.title ? 'Updated' : 'Unchanged',
          description: seoData.description ? 'Updated' : 'Unchanged',
          h1: seoData.h1 ? 'Updated' : 'Unchanged',
          schema: seoData.schema ? 'Added' : 'Unchanged'
        }
      });

      return true;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);

      this.results.failed.push({
        pageId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return false;
    }
  }

  /**
   * Update multiple pages from a template
   */
  async updatePages(pagesData) {
    console.log('\n🚀 Starting page updates...');
    console.log(`📋 ${pagesData.length} pages to update\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pagesData.length; i++) {
      const page = pagesData[i];
      process.stdout.write(`[${i + 1}/${pagesData.length}] `);

      const success = await this.updatePage(page.pageId, page.seo);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Rate limiting - be nice to the API
      if (i < pagesData.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return { successCount, failCount };
  }

  /**
   * Display summary of results
   */
  displaySummary(successCount, failCount) {
    console.log('\n\n📊 UPDATE SUMMARY');
    console.log('═════════════════════════════════════');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📋 Total: ${successCount + failCount}`);
    console.log('═════════════════════════════════════');

    if (this.results.failed.length > 0) {
      console.log('\n⚠️  Failed Updates:');
      this.results.failed.forEach(f => {
        console.log(`  • ${f.pageId}: ${f.error}`);
      });
    }

    console.log('\n📁 Results saved to: update-results.json');
  }

  /**
   * Save results to file
   */
  saveResults() {
    const resultsPath = path.join(__dirname, 'update-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
  }

  /**
   * Load pages update template
   */
  loadTemplate(templatePath) {
    if (!fs.existsSync(templatePath)) {
      console.error(`❌ Template file not found: ${templatePath}`);
      console.error('\nUsage: GHL_TOKEN="xxx" node update-pages-correct.js <template-file>');
      console.error('\nExample template structure:');
      console.error(JSON.stringify([
        {
          pageId: 'page-123',
          seo: {
            title: 'New Title',
            description: 'New description',
            keywords: 'keyword1, keyword2',
            h1: 'Main Heading',
            schema: { '@context': 'https://schema.org', '@type': 'LocalBusiness' }
          }
        }
      ], null, 2));
      process.exit(1);
    }

    const content = fs.readFileSync(templatePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Fetch all pages (for testing)
   */
  async listAllPages() {
    console.log('📋 Fetching all pages...\n');
    try {
      const pages = await this.client.listPages();
      return pages;
    } catch (error) {
      console.error(`❌ Error fetching pages: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 GHL Page Updater - Correctly Implemented');
  console.log('═══════════════════════════════════════════\n');

  const updater = new PageUpdater();

  // Get template path from command line or use default
  const templatePath = process.argv[2] || path.join(__dirname, 'pages-update-template.json');

  // Check if we should just list pages
  if (process.argv[2] === '--list') {
    try {
      const pages = await updater.listAllPages();
      console.log(`Found ${pages.length} pages:\n`);
      pages.forEach((page, i) => {
        console.log(`${i + 1}. ID: ${page.id}`);
        console.log(`   Name: ${page.name || '[No name]'}`);
        console.log(`   Title: ${page.seo?.title || '[No title]'}`);
        console.log('');
      });
    } catch (error) {
      console.error('Failed to list pages:', error.message);
      process.exit(1);
    }
    return;
  }

  // Load template
  console.log(`📖 Loading template: ${templatePath}`);
  let pagesData;
  try {
    pagesData = updater.loadTemplate(templatePath);
  } catch (error) {
    console.error(`❌ Failed to load template: ${error.message}`);
    process.exit(1);
  }

  // Update pages
  const { successCount, failCount } = await updater.updatePages(pagesData);

  // Display and save results
  updater.displaySummary(successCount, failCount);
  updater.saveResults();

  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = PageUpdater;
