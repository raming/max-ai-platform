#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LOCATION_ID = process.env.GHL_LOCATION_ID;
const WEBSITE_ID = 'Khu05zZF68u4Ka2ZFdUC';

// Try using the public GHL API endpoint instead of the admin panel
async function fetchPagesViaAPI() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Attempting to fetch pages via GHL API...\n');
    
    // Try the standard GHL API endpoint
    const url = `https://api.leadconnectorhq.com/websites/${WEBSITE_ID}/pages`;
    
    const options = {
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '1.0'
      }
    };

    if (!process.env.GHL_API_KEY) {
      console.error('❌ GHL_API_KEY not set in .env file');
      console.log('\nAlternative: You can provide the page list manually or get it from:');
      console.log('1. Open: https://app.1prompt.com/v2/location/' + LOCATION_ID + '/funnels-websites/websites/' + WEBSITE_ID + '/pages');
      console.log('2. Inspect Network tab (F12) when loading');
      console.log('3. Copy the response and save to pages-full-data.json');
      reject(new Error('No API key'));
      return;
    }

    https.get(url, options, (response) => {
      let responseData = '';
      
      response.on('data', chunk => {
        responseData += chunk;
      });

      response.on('end', () => {
        try {
          if (response.statusCode === 200) {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } else {
            console.log(`API returned ${response.statusCode}, trying alternative...`);
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    console.log('📋 GHL Pages Fetcher');
    console.log('═'.repeat(80));
    console.log('\nYour current GHL Setup:');
    console.log(`Location ID: ${LOCATION_ID}`);
    console.log(`Website ID: ${WEBSITE_ID}`);
    console.log(`\nTo get pages data, you have two options:\n`);

    console.log('OPTION 1: Using Browser (Most Reliable)');
    console.log('─'.repeat(80));
    console.log('1. Open your browser and go to:');
    console.log(`   https://app.1prompt.com/v2/location/${LOCATION_ID}/funnels-websites/websites/${WEBSITE_ID}/pages`);
    console.log('2. Right-click → Inspect → Network tab');
    console.log('3. Refresh the page');
    console.log('4. Look for a request to "pages" that returns JSON');
    console.log('5. Right-click that request → Copy → Copy response');
    console.log('6. Paste the JSON into: pages-full-data.json');
    console.log('7. Run: node process-pages.js\n');

    console.log('OPTION 2: Update .env with API Key');
    console.log('─'.repeat(80));
    console.log('1. Get your GHL_API_KEY from https://app.1prompt.com');
    console.log('2. Update the GHL_TOKEN in .env file');
    console.log('3. Run this script again\n');

    console.log('OPTION 3: Provide Token in Header');
    console.log('─'.repeat(80));
    console.log('Your current session token has expired (401 error).');
    console.log('You need to:\n');
    console.log('1. Go to https://app.1prompt.com/v2/location/' + LOCATION_ID);
    console.log('2. Log in with your GHL credentials');
    console.log('3. Open Developer Tools (F12)');
    console.log('4. Go to Application → Cookies → app.1prompt.com');
    console.log('5. Find and copy the session/auth token');
    console.log('6. Update GHL_TOKEN in .env with the new token\n');

    await fetchPagesViaAPI().catch(e => {
      console.log('ℹ️  GHL_API_KEY not configured or not working.\n');
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
