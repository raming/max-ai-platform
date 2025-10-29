#!/usr/bin/env node

/**
 * GHL API Testing Script
 * Test discovered endpoints to validate they work with your token
 */

const GHLAPIClient = require('./4-Sample-API-Client.js');

const TOKEN_ID = process.env.GHL_TOKEN || 'your-token-id-here';

async function runTests() {
  console.log('🧪 GHL API Testing Suite');
  console.log('🔑 Token: ' + TOKEN_ID.substring(0, 20) + '...');
  console.log('');

  const client = new GHLAPIClient(TOKEN_ID);

  const tests = [
    {
      name: 'Get Current User',
      fn: () => client.getCurrentUser()
    },
    {
      name: 'Get Location',
      fn: () => client.getLocation()
    },
    {
      name: 'List Contacts',
      fn: () => client.listContacts()
    },
    {
      name: 'List Pages',
      fn: () => client.listPages()
    },
    {
      name: 'List Campaigns',
      fn: () => client.listCampaigns()
    },
    {
      name: 'List Opportunities',
      fn: () => client.listOpportunities()
    }
  ];

  for (const test of tests) {
    try {
      console.log(`⏳ Testing: ${test.name}...`);
      const result = await test.fn();
      console.log(`✅ ${test.name}`);
      console.log(`   Response: ${typeof result === 'object' ? JSON.stringify(result).substring(0, 100) : result}`);
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('');
  console.log('✅ Testing complete!');
}

runTests().catch(console.error);
