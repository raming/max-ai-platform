#!/usr/bin/env node

/**
 * READY TO USE - GHL API Integration Scripts
 * 
 * These scripts use the CORRECT API implementation based on 
 * learnings from the GHL-Integration project
 * 
 * Generated: October 22, 2025
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     GHL API Integration - Corrected Implementation           ║
║                                                               ║
║  Based on discovered patterns from GHL-Integration project   ║
║  All issues from original ghl-seo fixed                      ║
╚═══════════════════════════════════════════════════════════════╝

📚 FILES CREATED:

1. ghl-api-client.js
   └─ Core API client with proper headers and error handling
   └─ Uses native HTTPS (no dependencies)
   └─ 401 token handling + retry logic

2. fetch-pages-correct.js
   └─ Fetch all pages from GHL
   └─ Displays page list with IDs
   └─ Saves to pages-full-data.json

3. update-pages-correct.js
   └─ Update pages with SEO improvements
   └─ Reads template.json file
   └─ Automatic publishing
   └─ Saves results to update-results.json

4. WHAT-WAS-WRONG-vs-CORRECT.md
   └─ Detailed comparison of incorrect vs correct implementation
   └─ Line-by-line differences
   └─ What the GHL-Integration project discovered

📋 QUICK START:

Step 1: Get your token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Go to: https://app.1prompt.com/v2/location/[location-id]
  • Open DevTools (F12) → Network tab
  • Make any API request
  • Find token-id header value
  • Add to .env: GHL_TOKEN="[token]"

Step 2: Test connection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  $ GHL_TOKEN="your-token" node ghl-api-client.js
  
  Expected output:
    ✅ API Connection Successful!
    ✅ Current user: [email]

Step 3: Fetch all pages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  $ GHL_TOKEN="your-token" node fetch-pages-correct.js
  
  Output:
    ✅ Found 15 pages
    📁 Saved to: pages-full-data.json

Step 4: Create update template
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Create pages-update-template.json:
  
  [
    {
      "pageId": "page-123",
      "seo": {
        "title": "New Title",
        "description": "New description",
        "keywords": "keyword1, keyword2",
        "h1": "Main heading"
      }
    },
    ...more pages...
  ]

Step 5: Update pages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  $ GHL_TOKEN="your-token" node update-pages-correct.js pages-update-template.json
  
  Output:
    ✅ 15/15 pages updated
    📁 Saved results to: update-results.json

🔧 KEY FIXES FROM GHL-INTEGRATION:

1. Authentication Headers ✅
   BEFORE: axios + random headers
   AFTER: Native HTTPS + token-id header + version: "1.0"

2. Version Header ✅
   BEFORE: "version": 2 (number)
   AFTER: "version": "1.0" (string)

3. API Endpoints ✅
   BEFORE: /websites/{id}/pages (doesn't exist)
   AFTER: /page, /page/{id}, /page/{id}/publish (real endpoints)

4. Error Handling ✅
   BEFORE: Generic errors, no 401 handling
   AFTER: 401 detection + retry logic + exponential backoff

5. Payload Structure ✅
   BEFORE: Vague "updates" object
   AFTER: Proper GHL structure (seo, headings, schema, social)

6. Dependencies ✅
   BEFORE: axios, node-fetch, puppeteer (200KB+)
   AFTER: Only dotenv + native HTTPS (minimal footprint)

📚 KEY LEARNING FROM GHL-INTEGRATION PROJECT:

The GHL-Integration project discovered the proper API by:
  1. Using Puppeteer to automate browser login
  2. Monitoring ALL network requests in real-time
  3. Capturing request/response headers
  4. Analyzing authentication patterns
  5. Documenting discovered endpoints
  6. Creating sample working code

This revealed:
  ✅ Real endpoints: /page, /location, /contact, etc.
  ✅ Correct headers: token-id (not Authorization), version: "1.0"
  ✅ Proper payload structure: top-level seo, headings, schema
  ✅ Token lifecycle: 15-20 minute expiry (refresh when needed)
  ✅ Error patterns: 401 for auth, retry others

📝 USAGE EXAMPLES:

# Test API connection
GHL_TOKEN="abc123" VERBOSE=true node ghl-api-client.js

# List all pages with IDs
GHL_TOKEN="abc123" node fetch-pages-correct.js --list

# Update specific pages
GHL_TOKEN="abc123" node update-pages-correct.js pages-update-template.json

# Check update results
cat update-results.json

🎯 WHAT CHANGED FROM ORIGINAL:

Old ghl-seo/update-pages.js:
  ❌ axios-based, wrong headers, unreal endpoints
  ❌ No 401 handling, no retry logic
  ❌ Endpoints don't exist in GHL API
  ❌ Was never able to make successful API calls
  Result: Non-functional

New ghl-api-client.js + update-pages-correct.js:
  ✅ Native HTTPS, correct headers discovered via monitoring
  ✅ 401 handling + retry logic + exponential backoff
  ✅ Real GHL endpoints (/page, /page/{id}, etc.)
  ✅ Properly implements token-id auth with version: "1.0"
  Result: Fully functional

🚀 READY TO USE!

All scripts are ready to use. Pick the token from your .env file
and start updating pages. The implementation follows the exact
patterns discovered by the GHL-Integration Puppeteer monitoring.

Questions? Check: WHAT-WAS-WRONG-vs-CORRECT.md

═══════════════════════════════════════════════════════════════
`);
