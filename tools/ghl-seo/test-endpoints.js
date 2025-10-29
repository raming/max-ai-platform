#!/usr/bin/env node

require('dotenv').config();
const GHLAPIClient = require('./ghl-api-client');

async function test() {
  const token = process.env.GHL_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  
  if (!token) {
    console.error('❌ GHL_TOKEN not set');
    process.exit(1);
  }
  if (!locationId) {
    console.error('❌ GHL_LOCATION_ID not set');
    process.exit(1);
  }

  const client = new GHLAPIClient(token, { verbose: true });

  try {
    console.log('\n🔍 Testing /funnels/page endpoint with locationId...\n');
    
    // Try the endpoint we saw in the headers with location ID
    const pages = await client.request('GET', `/funnels/page?locationId=${locationId}`);
    
    console.log('\n✅ SUCCESS!');
    console.log('Response type:', typeof pages);
    if (Array.isArray(pages)) {
      console.log('Number of pages:', pages.length);
      if (pages.length > 0) {
        console.log('First page:', JSON.stringify(pages[0], null, 2).substring(0, 800));
      }
    } else {
      console.log('Response:', JSON.stringify(pages, null, 2).substring(0, 800));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

test();
