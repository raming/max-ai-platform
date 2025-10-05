#!/usr/bin/env node

/**
 * GHL Token Analysis Tool
 * 
 * Analyzes the results from token investigation to identify patterns
 * and create actionable insights for token refresh implementation.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { jwtDecode } = require('jwt-decode');

class GHLTokenAnalyzer {
  constructor(resultsFile) {
    this.resultsFile = resultsFile;
    this.data = null;
  }

  async loadResults() {
    try {
      this.data = await fs.readJson(this.resultsFile);
      console.log(chalk.green(`✅ Loaded results from ${this.resultsFile}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load results: ${error.message}`));
      process.exit(1);
    }
  }

  analyzeAuthFlow() {
    console.log(chalk.blue('\n🔍 Analyzing Authentication Flow...'));
    
    const authRequests = this.data.networkLog.filter(log => 
      log.type === 'request' && this.isAuthEndpoint(log.url)
    );
    
    const authResponses = this.data.networkLog.filter(log => 
      log.type === 'response' && this.isAuthEndpoint(log.url)
    );

    console.log(chalk.yellow(`Found ${authRequests.length} auth requests and ${authResponses.length} auth responses`));
    
    // Group by endpoint
    const endpointMap = new Map();
    
    [...authRequests, ...authResponses].forEach(log => {
      const endpoint = this.extractEndpoint(log.url);
      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, { requests: [], responses: [] });
      }
      
      if (log.type === 'request') {
        endpointMap.get(endpoint).requests.push(log);
      } else {
        endpointMap.get(endpoint).responses.push(log);
      }
    });

    return {
      totalRequests: authRequests.length,
      totalResponses: authResponses.length,
      endpoints: Array.from(endpointMap.entries()).map(([endpoint, data]) => ({
        endpoint,
        requests: data.requests.length,
        responses: data.responses.length,
        methods: [...new Set(data.requests.map(r => r.method))],
        statusCodes: [...new Set(data.responses.map(r => r.status))]
      }))
    };
  }

  analyzeTokens() {
    console.log(chalk.blue('\n🎟️ Analyzing Token Patterns...'));
    
    const tokenAnalysis = {
      totalTokens: this.data.tokenLog.length,
      tokenTypes: {},
      expiryPatterns: [],
      refreshPatterns: []
    };

    this.data.tokenLog.forEach(token => {
      // Count token types
      if (!tokenAnalysis.tokenTypes[token.field]) {
        tokenAnalysis.tokenTypes[token.field] = 0;
      }
      tokenAnalysis.tokenTypes[token.field]++;

      // Analyze expiry patterns
      if (token.decoded && typeof token.decoded === 'object' && token.decoded.exp) {
        const issuedAt = new Date(token.decoded.iat * 1000);
        const expiresAt = new Date(token.decoded.exp * 1000);
        const lifetime = Math.floor((expiresAt - issuedAt) / 1000 / 60); // minutes
        
        tokenAnalysis.expiryPatterns.push({
          field: token.field,
          lifetimeMinutes: lifetime,
          issuedAt: issuedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          url: token.url
        });
      }
    });

    return tokenAnalysis;
  }

  analyzeRefreshPatterns() {
    console.log(chalk.blue('\n🔄 Analyzing Refresh Patterns...'));
    
    // Look for potential refresh endpoints
    const refreshEndpoints = this.data.networkLog.filter(log => 
      log.url.includes('refresh') || 
      log.url.includes('renew') ||
      (log.type === 'request' && log.method === 'POST' && this.isAuthEndpoint(log.url))
    );

    // Look for periodic requests that might be refresh calls
    const requestTimestamps = this.data.networkLog
      .filter(log => log.type === 'request')
      .map(log => ({ timestamp: new Date(log.timestamp), url: log.url }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const periodicPatterns = this.findPeriodicPatterns(requestTimestamps);

    return {
      refreshEndpoints: refreshEndpoints.map(log => ({
        url: log.url,
        method: log.method,
        timestamp: log.timestamp,
        status: log.status
      })),
      periodicPatterns
    };
  }

  findPeriodicPatterns(requests) {
    const patterns = [];
    const urlGroups = new Map();
    
    // Group requests by similar URLs
    requests.forEach(req => {
      const baseUrl = this.extractEndpoint(req.url);
      if (!urlGroups.has(baseUrl)) {
        urlGroups.set(baseUrl, []);
      }
      urlGroups.get(baseUrl).push(req.timestamp);
    });

    // Analyze intervals for each URL group
    urlGroups.forEach((timestamps, url) => {
      if (timestamps.length >= 3) {
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
          const interval = Math.floor((timestamps[i] - timestamps[i-1]) / 1000 / 60); // minutes
          intervals.push(interval);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const consistency = this.calculateConsistency(intervals);
        
        if (consistency > 0.7 && avgInterval > 0) { // 70% consistency threshold
          patterns.push({
            url,
            requestCount: timestamps.length,
            averageIntervalMinutes: Math.round(avgInterval),
            consistency: Math.round(consistency * 100),
            intervals
          });
        }
      }
    });

    return patterns.sort((a, b) => b.consistency - a.consistency);
  }

  calculateConsistency(intervals) {
    if (intervals.length <= 1) return 0;
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Consistency = 1 - (coefficient of variation)
    return Math.max(0, 1 - (stdDev / avg));
  }

  isAuthEndpoint(url) {
    const authPatterns = [
      '/auth', '/login', '/token', '/refresh', '/oauth', '/session'
    ];
    return authPatterns.some(pattern => url.includes(pattern));
  }

  extractEndpoint(url) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/');
      
      // Return meaningful endpoint path (up to 3 levels)
      return parsed.host + pathParts.slice(0, 4).join('/');
    } catch (e) {
      return url;
    }
  }

  generateRecommendations(authFlow, tokens, refreshPatterns) {
    console.log(chalk.blue('\n💡 Generating Recommendations...'));
    
    const recommendations = {
      tokenManagement: [],
      refreshStrategy: [],
      implementation: []
    };

    // Token management recommendations
    if (tokens.totalTokens > 0) {
      const hasRefreshToken = Object.keys(tokens.tokenTypes).some(type => 
        type.includes('refresh')
      );
      
      if (hasRefreshToken) {
        recommendations.tokenManagement.push({
          priority: 'HIGH',
          recommendation: 'Implement refresh token rotation',
          reason: 'Refresh tokens detected - use for automatic token renewal'
        });
      } else {
        recommendations.tokenManagement.push({
          priority: 'MEDIUM',
          recommendation: 'Implement session refresh monitoring',
          reason: 'No refresh tokens found - monitor session expiry and re-authenticate'
        });
      }

      // Analyze token lifetimes
      const lifetimes = tokens.expiryPatterns.map(p => p.lifetimeMinutes);
      if (lifetimes.length > 0) {
        const avgLifetime = lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length;
        const refreshAt = Math.floor(avgLifetime * 0.8); // Refresh at 80% of lifetime
        
        recommendations.refreshStrategy.push({
          priority: 'HIGH',
          recommendation: `Refresh tokens every ${refreshAt} minutes`,
          reason: `Average token lifetime is ${Math.round(avgLifetime)} minutes`
        });
      }
    }

    // Refresh pattern recommendations
    if (refreshPatterns.refreshEndpoints.length > 0) {
      recommendations.refreshStrategy.push({
        priority: 'HIGH',
        recommendation: 'Use dedicated refresh endpoints',
        reason: `Found ${refreshPatterns.refreshEndpoints.length} potential refresh endpoints`
      });
    }

    if (refreshPatterns.periodicPatterns.length > 0) {
      const topPattern = refreshPatterns.periodicPatterns[0];
      recommendations.refreshStrategy.push({
        priority: 'MEDIUM',
        recommendation: `Monitor ${topPattern.url} for automatic refresh`,
        reason: `Detected consistent ${topPattern.averageIntervalMinutes}min refresh pattern`
      });
    }

    // Implementation recommendations
    recommendations.implementation.push({
      priority: 'HIGH',
      recommendation: 'Create token proxy service with health monitoring',
      reason: 'Centralized token management with automatic refresh capabilities'
    });

    recommendations.implementation.push({
      priority: 'MEDIUM',
      recommendation: 'Implement exponential backoff for failed refresh attempts',
      reason: 'Handle token refresh failures gracefully'
    });

    return recommendations;
  }

  async generateReport() {
    const authFlow = this.analyzeAuthFlow();
    const tokens = this.analyzeTokens();
    const refreshPatterns = this.analyzeRefreshPatterns();
    const recommendations = this.generateRecommendations(authFlow, tokens, refreshPatterns);

    const report = {
      timestamp: new Date().toISOString(),
      source: this.resultsFile,
      analysis: {
        authFlow,
        tokens,
        refreshPatterns,
        recommendations
      }
    };

    const outputPath = this.resultsFile.replace('.json', '-analysis.json');
    await fs.writeJson(outputPath, report, { spaces: 2 });
    
    console.log(chalk.green(`📊 Analysis saved to: ${outputPath}`));
    
    // Generate markdown report
    await this.generateMarkdownReport(report);
    
    return report;
  }

  async generateMarkdownReport(analysis) {
    const mdPath = this.resultsFile.replace('.json', '-analysis.md');
    
    let md = `# GHL Token Analysis Report\n\n`;
    md += `**Generated**: ${analysis.timestamp}\n`;
    md += `**Source**: ${analysis.source}\n\n`;

    // Auth Flow Analysis
    md += `## Authentication Flow Analysis\n\n`;
    md += `- **Total Auth Requests**: ${analysis.analysis.authFlow.totalRequests}\n`;
    md += `- **Total Auth Responses**: ${analysis.analysis.authFlow.totalResponses}\n\n`;
    
    if (analysis.analysis.authFlow.endpoints.length > 0) {
      md += `### Key Endpoints\n\n`;
      analysis.analysis.authFlow.endpoints.forEach(endpoint => {
        md += `- **${endpoint.endpoint}**\n`;
        md += `  - Methods: ${endpoint.methods.join(', ')}\n`;
        md += `  - Status Codes: ${endpoint.statusCodes.join(', ')}\n`;
        md += `  - Requests: ${endpoint.requests}, Responses: ${endpoint.responses}\n\n`;
      });
    }

    // Token Analysis
    md += `## Token Analysis\n\n`;
    md += `- **Total Tokens Found**: ${analysis.analysis.tokens.totalTokens}\n\n`;
    
    if (Object.keys(analysis.analysis.tokens.tokenTypes).length > 0) {
      md += `### Token Types\n\n`;
      Object.entries(analysis.analysis.tokens.tokenTypes).forEach(([type, count]) => {
        md += `- **${type}**: ${count}\n`;
      });
      md += `\n`;
    }

    if (analysis.analysis.tokens.expiryPatterns.length > 0) {
      md += `### Token Expiry Patterns\n\n`;
      analysis.analysis.tokens.expiryPatterns.forEach(pattern => {
        md += `- **${pattern.field}**: ${pattern.lifetimeMinutes} minutes\n`;
        md += `  - Issued: ${pattern.issuedAt}\n`;
        md += `  - Expires: ${pattern.expiresAt}\n\n`;
      });
    }

    // Refresh Patterns
    md += `## Refresh Pattern Analysis\n\n`;
    
    if (analysis.analysis.refreshPatterns.refreshEndpoints.length > 0) {
      md += `### Potential Refresh Endpoints\n\n`;
      analysis.analysis.refreshPatterns.refreshEndpoints.forEach(endpoint => {
        md += `- **${endpoint.method}** ${endpoint.url}\n`;
        md += `  - Status: ${endpoint.status}\n`;
        md += `  - Time: ${endpoint.timestamp}\n\n`;
      });
    }

    if (analysis.analysis.refreshPatterns.periodicPatterns.length > 0) {
      md += `### Periodic Request Patterns\n\n`;
      analysis.analysis.refreshPatterns.periodicPatterns.forEach(pattern => {
        md += `- **${pattern.url}**\n`;
        md += `  - Average Interval: ${pattern.averageIntervalMinutes} minutes\n`;
        md += `  - Consistency: ${pattern.consistency}%\n`;
        md += `  - Request Count: ${pattern.requestCount}\n\n`;
      });
    }

    // Recommendations
    md += `## Recommendations\n\n`;
    
    ['tokenManagement', 'refreshStrategy', 'implementation'].forEach(category => {
      const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      md += `### ${categoryName}\n\n`;
      
      analysis.analysis.recommendations[category].forEach(rec => {
        md += `**${rec.priority} PRIORITY**: ${rec.recommendation}\n`;
        md += `*Reason*: ${rec.reason}\n\n`;
      });
    });

    await fs.writeFile(mdPath, md);
    console.log(chalk.green(`📋 Markdown report saved to: ${mdPath}`));
  }

  async run() {
    try {
      await this.loadResults();
      const analysis = await this.generateReport();
      
      console.log(chalk.blue('\n📈 Analysis Summary:'));
      console.log(chalk.yellow(`- Auth endpoints: ${analysis.analysis.authFlow.endpoints.length}`));
      console.log(chalk.yellow(`- Tokens found: ${analysis.analysis.tokens.totalTokens}`));
      console.log(chalk.yellow(`- Refresh patterns: ${analysis.analysis.refreshPatterns.periodicPatterns.length}`));
      console.log(chalk.yellow(`- Total recommendations: ${
        analysis.analysis.recommendations.tokenManagement.length +
        analysis.analysis.recommendations.refreshStrategy.length +
        analysis.analysis.recommendations.implementation.length
      }`));
      
      console.log(chalk.green('\n🎉 Analysis completed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'), error);
    }
  }
}

// Command line usage
if (require.main === module) {
  const resultsFile = process.argv[2];
  
  if (!resultsFile) {
    console.error(chalk.red('❌ Please provide a results file path'));
    console.log(chalk.yellow('Usage: node analyze-tokens.js <results-file.json>'));
    process.exit(1);
  }

  const analyzer = new GHLTokenAnalyzer(resultsFile);
  analyzer.run();
}

module.exports = GHLTokenAnalyzer;