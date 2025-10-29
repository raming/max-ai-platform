#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LOCATION_ID = process.env.GHL_LOCATION_ID;
const SESSION_TOKEN = process.env.GHL_SESSION_TOKEN;
const WEBSITE_ID = 'Khu05zZF68u4Ka2ZFdUC'; // From your URL

function fetchPages() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Fetching pages from GHL...\n');
    
    const url = `https://app.1prompt.com/v2/location/${LOCATION_ID}/funnels-websites/websites/${WEBSITE_ID}/pages`;
    
    const options = {
      headers: {
        'Authorization': `Bearer ${SESSION_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', async () => {
        try {
          if (response.statusCode !== 200) {
            console.error(`❌ Error: ${response.statusCode}`);
            console.error('Response:', data.substring(0, 500));
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }

          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const apiData = await fetchPages();
    console.log('✅ Successfully fetched pages data\n');

    // Parse and display pages
    const pages = apiData.pages || apiData.data || [];
    
    if (!pages.length) {
      console.log('No pages found or data structure different');
      console.log('Full response keys:', Object.keys(apiData));
      console.log('Full data:', JSON.stringify(apiData, null, 2).substring(0, 1000));
      return;
    }

    console.log(`📄 Found ${pages.length} pages:\n`);
    console.log('═'.repeat(120));

    const pageMapping = [];

    pages.forEach((page, index) => {
      const pageId = page.id || page._id || page.pageId;
      const pageName = page.name || page.title || 'Untitled';
      const pageUrl = page.url || page.slug || 'N/A';
      
      console.log(`\n${index + 1}. PAGE ID: ${pageId}`);
      console.log(`   Name: ${pageName}`);
      console.log(`   URL: ${pageUrl}`);
      console.log(`   Status: ${page.isPublished ? '✅ Published' : '⏸️ Draft'}`);
      
      pageMapping.push({
        index: index + 1,
        id: pageId,
        name: pageName,
        url: pageUrl,
        published: page.isPublished
      });
    });

    console.log('\n' + '═'.repeat(120));

    // Save mapping for later use
    const mappingFile = path.join(__dirname, 'pages-mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify(pageMapping, null, 2));
    console.log(`\n✅ Page mapping saved to: pages-mapping.json\n`);

    // Also save full data
    const fullFile = path.join(__dirname, 'pages-full-data.json');
    fs.writeFileSync(fullFile, JSON.stringify(apiData, null, 2));
    console.log(`✅ Full page data saved to: pages-full-data.json\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n⚠️ Authentication error - your token may be expired.');
      console.error('Please update the GHL_SESSION_TOKEN in .env file with a fresh token.');
    }
  }
}

main();
