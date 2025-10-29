#!/usr/bin/env node

/**
 * Quick test to fetch pages from GHL
 */

require('dotenv').config();
const GHLAPIClient = require('./ghl-api-client');

async function test() {
  const token = process.env.GHL_TOKEN;
  if (!token) {
    console.error('❌ GHL_TOKEN not set in .env');
    process.exit(1);
  }

  const client = new GHLAPIClient(token, { verbose: true });

  try {
    console.log('\n🔄 Fetching all pages from GHL...\n');
    const pages = await client.listPages();
    console.log('\n✅ Success! Pages:', JSON.stringify(pages, null, 2).substring(0, 500));
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

test();
