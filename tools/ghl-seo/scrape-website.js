#!/usr/bin/env node

/**
 * GoHighLevel Website Scraper using Puppeteer
 * 
 * This script scrapes your GoHighLevel website and extracts:
 * - Page structure and content
 * - Meta tags and SEO elements
 * - Internal links and navigation
 * - Images and media
 * - Performance metrics
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

class GHLWebsiteScraper {
  constructor(config) {
    this.config = {
      url: config.url || process.env.GHL_WEBSITE_URL,
      sessionToken: config.sessionToken || process.env.GHL_SESSION_TOKEN,
      outputDir: config.outputDir || './scraped-data',
      screenshots: config.screenshots !== false,
      analyzeMobile: config.analyzeMobile !== false,
    };
    
    this.pages = [];
    this.seoData = {};
  }

  async initialize() {
    console.log(chalk.blue('🚀 Initializing GHL Website Scraper...\n'));
    
    // Create output directory
    await fs.mkdir(this.config.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't work in Windows
        '--disable-gpu'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set session token if provided
    if (this.config.sessionToken) {
      await this.page.setCookie({
        name: 'session_token',
        value: this.config.sessionToken,
        domain: new URL(this.config.url).hostname
      });
    }
    
    // Set user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
  }

  async scrapeHomepage() {
    const spinner = ora('Scraping homepage...').start();
    
    try {
      await this.page.goto(this.config.url, {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      // Wait a bit more for dynamic content
      await this.page.waitForTimeout(3000);
      
      // Extract page data
      const pageData = await this.extractPageData();
      
      // Take screenshot
      if (this.config.screenshots) {
        await this.page.screenshot({
          path: path.join(this.config.outputDir, 'homepage-desktop.png'),
          fullPage: true
        });
      }
      
      // Mobile version
      if (this.config.analyzeMobile) {
        await this.page.setViewport({ width: 375, height: 812 });
        await this.page.screenshot({
          path: path.join(this.config.outputDir, 'homepage-mobile.png'),
          fullPage: true
        });
        await this.page.setViewport({ width: 1920, height: 1080 });
      }
      
      this.pages.push({
        url: this.config.url,
        title: 'Homepage',
        ...pageData
      });
      
      spinner.succeed('Homepage scraped successfully');
      return pageData;
      
    } catch (error) {
      spinner.fail('Failed to scrape homepage');
      throw error;
    }
  }

  async extractPageData() {
    return await this.page.evaluate(() => {
      // Extract meta tags
      const getMeta = (name) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
      };
      
      // Extract all headings
      const headings = {
        h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()),
        h2: Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim()),
        h3: Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim()),
      };
      
      // Extract links
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        isInternal: a.href.startsWith(window.location.origin)
      }));
      
      // Extract images
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
        height: img.height,
        hasAlt: !!img.alt
      }));
      
      // Extract structured data
      const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(script => {
          try {
            return JSON.parse(script.textContent);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      
      // Get page content
      const bodyText = document.body.innerText;
      const wordCount = bodyText.trim().split(/\s+/).length;
      
      return {
        meta: {
          title: document.title,
          description: getMeta('description'),
          keywords: getMeta('keywords'),
          ogTitle: getMeta('og:title'),
          ogDescription: getMeta('og:description'),
          ogImage: getMeta('og:image'),
          twitterCard: getMeta('twitter:card'),
          viewport: getMeta('viewport'),
          robots: getMeta('robots'),
        },
        headings,
        links: {
          total: links.length,
          internal: links.filter(l => l.isInternal).length,
          external: links.filter(l => !l.isInternal).length,
          list: links
        },
        images: {
          total: images.length,
          withAlt: images.filter(img => img.hasAlt).length,
          withoutAlt: images.filter(img => !img.hasAlt).length,
          list: images
        },
        content: {
          wordCount,
          hasH1: headings.h1.length > 0,
          h1Count: headings.h1.length,
          paragraphCount: document.querySelectorAll('p').length
        },
        structuredData,
        url: window.location.href,
        canonical: document.querySelector('link[rel="canonical"]')?.href || null
      };
    });
  }

  async discoverPages() {
    const spinner = ora('Discovering internal pages...').start();
    
    try {
      const homepage = this.pages[0];
      const internalLinks = homepage.links.list
        .filter(link => link.isInternal)
        .map(link => link.href);
      
      // Remove duplicates and filter out anchors
      const uniquePages = [...new Set(internalLinks)]
        .filter(url => !url.includes('#'))
        .filter(url => url !== this.config.url)
        .slice(0, 20); // Limit to 20 pages for now
      
      spinner.text = `Found ${uniquePages.length} internal pages`;
      spinner.succeed();
      
      return uniquePages;
      
    } catch (error) {
      spinner.fail('Failed to discover pages');
      throw error;
    }
  }

  async scrapePage(url, title) {
    const spinner = ora(`Scraping ${title}...`).start();
    
    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      const pageData = await this.extractPageData();
      
      // Take screenshot
      if (this.config.screenshots) {
        const filename = title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.png';
        await this.page.screenshot({
          path: path.join(this.config.outputDir, filename),
          fullPage: true
        });
      }
      
      this.pages.push({
        url,
        title,
        ...pageData
      });
      
      spinner.succeed(`Scraped ${title}`);
      
    } catch (error) {
      spinner.fail(`Failed to scrape ${title}`);
      console.error(chalk.red(error.message));
    }
  }

  async scrapeAllPages() {
    console.log(chalk.blue('\n📄 Scraping all pages...\n'));
    
    // Scrape homepage first
    await this.scrapeHomepage();
    
    // Discover other pages
    const pages = await this.discoverPages();
    
    // Scrape each page
    for (const pageUrl of pages) {
      try {
        const urlPath = new URL(pageUrl).pathname;
        const title = urlPath === '/' ? 'Homepage' : urlPath.replace(/^\/|\/$/g, '');
        await this.scrapePage(pageUrl, title);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(chalk.red(`Error scraping ${pageUrl}:`, error.message));
      }
    }
  }

  async analyzeSEO() {
    console.log(chalk.blue('\n🔍 Analyzing SEO elements...\n'));
    
    const issues = [];
    const recommendations = [];
    
    this.pages.forEach((page, index) => {
      const pageIssues = [];
      const pageRecommendations = [];
      
      // Title tag analysis
      if (!page.meta.title) {
        pageIssues.push('Missing title tag');
      } else if (page.meta.title.length < 30) {
        pageRecommendations.push(`Title too short (${page.meta.title.length} chars). Aim for 50-60 characters.`);
      } else if (page.meta.title.length > 60) {
        pageRecommendations.push(`Title too long (${page.meta.title.length} chars). Keep it under 60 characters.`);
      }
      
      // Meta description analysis
      if (!page.meta.description) {
        pageIssues.push('Missing meta description');
      } else if (page.meta.description.length < 120) {
        pageRecommendations.push(`Meta description too short (${page.meta.description.length} chars). Aim for 150-160 characters.`);
      } else if (page.meta.description.length > 160) {
        pageRecommendations.push(`Meta description too long (${page.meta.description.length} chars). Keep it under 160 characters.`);
      }
      
      // H1 analysis
      if (page.content.h1Count === 0) {
        pageIssues.push('Missing H1 tag');
      } else if (page.content.h1Count > 1) {
        pageIssues.push(`Multiple H1 tags found (${page.content.h1Count}). Should have only one.`);
      }
      
      // Image alt text
      if (page.images.withoutAlt > 0) {
        pageRecommendations.push(`${page.images.withoutAlt} images missing alt text`);
      }
      
      // Content length
      if (page.content.wordCount < 300) {
        pageRecommendations.push(`Low word count (${page.content.wordCount}). Aim for at least 500 words for better SEO.`);
      }
      
      // Open Graph tags
      if (!page.meta.ogTitle || !page.meta.ogDescription) {
        pageRecommendations.push('Missing Open Graph tags for social media sharing');
      }
      
      // Canonical URL
      if (!page.canonical) {
        pageRecommendations.push('Missing canonical URL');
      }
      
      // Structured data
      if (!page.structuredData || page.structuredData.length === 0) {
        pageRecommendations.push('No structured data (Schema.org) found');
      }
      
      issues.push({
        page: page.title,
        url: page.url,
        critical: pageIssues,
        recommendations: pageRecommendations
      });
    });
    
    this.seoData = {
      totalPages: this.pages.length,
      issues,
      summary: this.generateSummary(issues)
    };
    
    return this.seoData;
  }

  generateSummary(issues) {
    const allCritical = issues.flatMap(i => i.critical);
    const allRecommendations = issues.flatMap(i => i.recommendations);
    
    return {
      criticalIssues: allCritical.length,
      recommendations: allRecommendations.length,
      pagesAnalyzed: this.pages.length,
      commonIssues: this.findCommonIssues(allCritical, allRecommendations)
    };
  }

  findCommonIssues(critical, recommendations) {
    const allIssues = [...critical, ...recommendations];
    const issueCounts = {};
    
    allIssues.forEach(issue => {
      const key = issue.split('(')[0].trim(); // Remove counts in parentheses
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });
    
    return Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, occurrences: count }));
  }

  async saveResults() {
    const spinner = ora('Saving results...').start();
    
    try {
      // Save raw page data
      await fs.writeFile(
        path.join(this.config.outputDir, 'pages-data.json'),
        JSON.stringify(this.pages, null, 2)
      );
      
      // Save SEO analysis
      await fs.writeFile(
        path.join(this.config.outputDir, 'seo-analysis.json'),
        JSON.stringify(this.seoData, null, 2)
      );
      
      // Generate HTML report
      await this.generateHTMLReport();
      
      spinner.succeed('Results saved successfully');
      
    } catch (error) {
      spinner.fail('Failed to save results');
      throw error;
    }
  }

  async generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Analysis Report - ${new URL(this.config.url).hostname}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #ecf0f1; padding: 20px; border-radius: 5px; text-align: center; }
        .stat-card .number { font-size: 36px; font-weight: bold; color: #3498db; }
        .stat-card .label { color: #7f8c8d; margin-top: 5px; }
        .issue { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .critical { background: #f8d7da; border-left-color: #dc3545; }
        .recommendation { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .page-section { margin: 30px 0; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; }
        .page-title { font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .page-url { color: #7f8c8d; font-size: 14px; margin-bottom: 15px; }
        ul { line-height: 1.8; }
        .common-issues { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .common-issues li { margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 SEO Analysis Report</h1>
        <p><strong>Website:</strong> ${this.config.url}</p>
        <p><strong>Analysis Date:</strong> ${new Date().toLocaleString()}</p>
        
        <div class="summary">
            <div class="stat-card">
                <div class="number">${this.seoData.totalPages}</div>
                <div class="label">Pages Analyzed</div>
            </div>
            <div class="stat-card">
                <div class="number">${this.seoData.summary.criticalIssues}</div>
                <div class="label">Critical Issues</div>
            </div>
            <div class="stat-card">
                <div class="number">${this.seoData.summary.recommendations}</div>
                <div class="label">Recommendations</div>
            </div>
        </div>
        
        <div class="common-issues">
            <h2>📊 Most Common Issues</h2>
            <ul>
                ${this.seoData.summary.commonIssues.map(item => 
                    `<li><strong>${item.issue}</strong> - Found on ${item.occurrences} page(s)</li>`
                ).join('')}
            </ul>
        </div>
        
        <h2>📄 Page-by-Page Analysis</h2>
        ${this.seoData.issues.map(page => `
            <div class="page-section">
                <div class="page-title">${page.page}</div>
                <div class="page-url">${page.url}</div>
                
                ${page.critical.length > 0 ? `
                    <h3>🚨 Critical Issues</h3>
                    ${page.critical.map(issue => `<div class="issue critical">${issue}</div>`).join('')}
                ` : ''}
                
                ${page.recommendations.length > 0 ? `
                    <h3>💡 Recommendations</h3>
                    ${page.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
                ` : ''}
                
                ${page.critical.length === 0 && page.recommendations.length === 0 ? 
                    '<div class="recommendation">✅ No major issues found on this page!</div>' : ''
                }
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(this.config.outputDir, 'seo-report.html'),
      html
    );
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.scrapeAllPages();
      await this.analyzeSEO();
      await this.saveResults();
      
      console.log(chalk.green('\n✅ Analysis complete!\n'));
      console.log(chalk.blue('Results saved to:'), this.config.outputDir);
      console.log(chalk.blue('Open seo-report.html to view the full report\n'));
      
      // Display summary
      console.log(chalk.yellow('Summary:'));
      console.log(`  Pages analyzed: ${this.seoData.totalPages}`);
      console.log(`  Critical issues: ${this.seoData.summary.criticalIssues}`);
      console.log(`  Recommendations: ${this.seoData.summary.recommendations}\n`);
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scraper = new GHLWebsiteScraper({
    url: process.env.GHL_WEBSITE_URL,
    sessionToken: process.env.GHL_SESSION_TOKEN
  });
  
  scraper.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = GHLWebsiteScraper;