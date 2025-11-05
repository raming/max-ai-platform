const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'api-documentation');

/**
 * Analyze collected API data and generate insights
 */
function analyzeResults() {
  console.log('\n📊 GHL API Analysis Report\n');

  try {
    // Load all data
    const callsData = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, '1-API-Calls-Complete-Log.json')));
    const authData = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, '2-Authentication-Patterns.json')));
    const headerData = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, '3-Header-Patterns.json')));
    const endpointData = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, '4-Endpoint-Registry.json')));
    const refreshData = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, '5-Token-Refresh-Events.json')));

    console.log('=== STATISTICS ===\n');
    console.log('Total API Calls:', callsData.totalCalls);
    console.log('Unique Endpoints:', endpointData.totalEndpoints);
    console.log('Authentication Methods:', authData.summary.totalMethods);
    console.log('Unique Headers:', headerData.summary.totalHeaders);
    console.log('Token Refresh Events:', refreshData.totalRefreshEvents);

    console.log('\n=== AUTHENTICATION METHODS ===\n');
    authData.patterns.forEach(pattern => {
      console.log(`${pattern.method}: ${pattern.count} calls`);
      console.log(`  Headers: ${pattern.associatedHeaders.slice(0, 3).join(', ')}`);
    });

    console.log('\n=== CRITICAL HEADERS ===\n');
    const criticalHeaders = ['token-id', 'authorization', 'version', 'content-type'];
    headerData.headers
      .filter(h => criticalHeaders.includes(h.header))
      .forEach(h => {
        console.log(`${h.header}:`);
        console.log(`  Count: ${h.count}`);
        console.log(`  Unique Values: ${h.totalUniqueValues}`);
        if (h.values.length > 0) {
          console.log(`  Sample: ${h.values[0]}`);
        }
      });

    console.log('\n=== TOP 10 ENDPOINTS ===\n');
    endpointData.endpoints.slice(0, 10).forEach((e, idx) => {
      console.log(`${idx + 1}. ${e.method} ${e.endpoint}`);
      console.log(`   Calls: ${e.callCount}`);
      console.log(`   Auth: ${e.authMethods.join(', ')}`);
      console.log(`   Headers: ${e.headers.length}`);
    });

    console.log('\n=== TOKEN REFRESH ===\n');
    if (refreshData.totalRefreshEvents > 0) {
      const refreshUrls = new Set(refreshData.events.map(e => e.url));
      console.log('Refresh Endpoints:');
      refreshUrls.forEach(url => console.log('  - ' + url));
      
      console.log('\nRefresh Headers:');
      const refreshHeaders = new Set();
      refreshData.events.forEach(e => {
        Object.keys(e.headers).forEach(h => refreshHeaders.add(h));
      });
      refreshHeaders.forEach(h => console.log('  - ' + h));
    } else {
      console.log('No refresh events captured');
    }

    console.log('\n=== KEY FINDINGS ===\n');
    
    // Analyze auth distribution
    const totalCalls = callsData.totalCalls;
    authData.patterns.forEach(p => {
      const percentage = ((p.count / totalCalls) * 100).toFixed(1);
      console.log(`${p.method}: ${percentage}% of all calls`);
    });

    // Find most used headers
    console.log('\nMost Used Headers (excluding common browser):');
    headerData.headers
      .filter(h => !['user-agent', 'accept', 'accept-encoding', 'accept-language'].includes(h.header))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .forEach(h => {
        console.log(`  ${h.header}: ${h.count} times`);
      });

    // Version header analysis
    const versionHeader = headerData.headers.find(h => h.header === 'version');
    if (versionHeader) {
      console.log('\nVersion Header Details:');
      console.log(`  Total Uses: ${versionHeader.count}`);
      console.log(`  Unique Values: ${versionHeader.totalUniqueValues}`);
      console.log(`  Values: ${versionHeader.values.join(', ')}`);
    }

    console.log('\n=== RECOMMENDATIONS ===\n');
    console.log('1. Use token-id header for authentication');
    console.log('2. Include version header on all API calls');
    console.log('3. Handle token refresh via: ' + 
      Array.from(new Set(refreshData.events.map(e => e.url))).slice(0, 1)[0]);
    console.log('4. Support Bearer token fallback for some endpoints');
    console.log('5. Include critical headers: channel, source, baggage');

    console.log('\n✅ Analysis complete!\n');
    console.log('View detailed results:');
    console.log('  - 1-API-Calls-Complete-Log.json: Every API call');
    console.log('  - 2-Authentication-Patterns.json: Auth methods');
    console.log('  - 3-Header-Patterns.json: All headers');
    console.log('  - 4-Endpoint-Registry.json: Endpoint reference');
    console.log('  - 5-Token-Refresh-Events.json: Token lifecycle');
    console.log('  - README.md: Human-readable guide\n');

  } catch (error) {
    console.error('❌ Error analyzing results:', error.message);
    console.log('\nMake sure you have run the monitor first:');
    console.log('  npm run monitor');
  }
}

analyzeResults();
