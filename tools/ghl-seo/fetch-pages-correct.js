#!/usr/bin/env node

/**
 * Fetch GHL Pages - Correctly Implemented
 * 
 * Fetches all pages from GHL with proper error handling and token management
 * Uses correct API client patterns from GHL-Integration project
 * 
 * Usage:
 *   GHL_TOKEN="your-token" node fetch-pages-correct.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const GHLAPIClient = require('./ghl-api-client');

async function main() {
  console.log('\n🔍 Fetching Pages from GoHighLevel');
  console.log('═════════════════════════════════\n');

  // Get token
  const token = process.env.GHL_TOKEN;
  if (!token) {
    console.error('❌ Error: GHL_TOKEN environment variable not set\n');
    console.error('Usage: GHL_TOKEN="your-token" node fetch-pages-correct.js\n');
    console.error('How to get your token:');
    console.error('1. Go to https://app.1prompt.com/v2/location/[location-id]');
    console.error('2. Open browser DevTools (F12)');
    console.error('3. Go to Network tab');
    console.error('4. Find any request to backend.leadconnectorhq.com');
    console.error('5. Copy the token-id header value');
    console.error('6. Add to .env: GHL_TOKEN="[paste-token]"\n');
    process.exit(1);
  }

  // Create API client
  const client = new GHLAPIClient(token, {
    verbose: process.env.VERBOSE === 'true'
  });

  try {
    // Step 1: Fetch pages directly (skip user verification)
    console.log('� Fetching pages...');
    const pages = await client.request('GET', `/funnels/page?locationId=${locationId}&funnelId=Khu05zZF68u4Ka2ZFdUC&limit=20&offset=0`);

    if (!pages || pages.length === 0) {
      console.warn('⚠️  No pages found or empty response\n');
      console.log('Response:', JSON.stringify(pages, null, 2));
      return;
    }

    console.log(`✅ Found ${pages.length} pages\n`);

    pages.forEach((page, i) => {
      console.log(`${i + 1}. ${page.name || '[No Name]'}`);
      console.log(`   ID: ${page.id}`);
      console.log(`   URL: ${page.url || '[No URL]'}`);
      console.log(`   Title: ${page.seo?.title || '[No Title]'}`);
      console.log(`   Description: ${(page.seo?.description || '[No Description]').substring(0, 50)}...`);
      console.log('');
    });

    // Step 4: Save to file
    const outputPath = path.join(__dirname, 'pages-full-data.json');
    fs.writeFileSync(outputPath, JSON.stringify({ pages, fetchedAt: new Date().toISOString() }, null, 2));
    
    console.log(`✅ Data saved to: pages-full-data.json`);

    // Step 5: Show usage
    console.log('\n💡 Next Steps:');
    console.log('1. Use page IDs above in your update template');
    console.log('2. Run: GHL_TOKEN="..." node update-pages-correct.js <template.json>');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.statusCode === 401) {
      console.error('\n💡 Token expired or invalid:');
      console.error('1. Get a fresh token from: https://app.1prompt.com/v2/location/[location-id]');
      console.error('2. Update .env file with new token');
      console.error('3. Try again');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
